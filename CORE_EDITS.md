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

---

# Session 2 - icon pipeline, desktop rebrand, release-channel origin

Product repo github.com/abbbleco/minerva, release origin
https://minerva-assets.abbble.co.za. Continues the tracker above.

Tracked diff for this session: **319 files changed, 966 insertions(+),
818 deletions(-)**, plus a new app in the monorepo.

## 7. Icon pipeline (replaced)

**Problem.** `scripts/generate_icons.py` (1013 lines) requires the brand art to be
a *single self-closing `<path>` monochrome silhouette*. This fork's
`assets/nous-girl-*.svg` is a full-colour illustration: 2493 `<path>â€¦</path>`
pairs, 130 distinct fills, and `black`/`white` byte-identical to each other. The
generator asserted immediately, so no icon could be regenerated at all â€” and the
committed MSIX artwork had silently drifted onto the old monochrome mark.

**Change.** Replaced the art pipeline with a size pipeline.

- **New** `scripts/render_icons.py` (~230 lines). One rule: *a target is the
  master tile rendered at N pixels behind a squircle mask*. Two inputs
  (`assets/icon-master.svg`, `assets/icon-master-dark.svg`), one loop over a size
  table. No path extraction, no bbox fit, no node editing â€” so the master can
  come out of any drawing tool.
- `scripts/generate-icons.mjs` now wraps `render_icons.py` (documented entry
  point in `contributing.md`, unchanged).
- `scripts/generate_icons.py` **left on disk untouched**; it still holds the
  canary/commit-badge flavouring.
- `contributing.md` icon paragraph rewritten (it also carried a stale
  "do not commit generated outputs" line that contradicted the build).

**Verified.** 85 targets regenerated; `generate-icons.mjs --check` reports
0 problems. All 62 MSIX `appx` files changed, filenames and sizes identical to
before (`Wide310x150Logo.scale-400` = 1240Ã—600 etc.). Windows taskbar/Start bitmaps
now carry the new brand (`Square150x150Logo.png` went 56 â†’ 6274 colours).

**Deliberately not generated** (reported by the script, not guessed):

| Target | Why |
|---|---|
| `website/static/img/logo{,-dark}.png` | bare mark on transparency â€” a full-bleed tile cannot produce it. Needs `assets/nous-mark.png`. |
| `apps/desktop/assets/icon.icon/`, `â€¦/icon.icon/` | macOS 26 Icon Composer package needs a separate art layer, not a tile. |
| `apps/desktop/packaging/dmg-volume.icns` | hand-made drive artwork. |

---

## 8. Desktop rebrand (user-visible UI only)

**Rule applied, in order:** `ABBBLE CO` â†’ `ABBBLE CO`, then `Hermes` â†’
`Minerva`, then `Nous` â†’ `Minerva`.

Applied with a **TypeScript AST walk**, not a regex â€” an apostrophe inside a
double-quoted string (`"Couldn't restart Hermes"`) makes a regex pair the wrong
quotes and silently skips values. First pass with a regex was discarded for this
reason.

**~2,700 display strings across 145 files:**

- 25 i18n catalog files (en, de, es, fr, ja, ru, zh, zh-hant, ar)
- 52 inline UI files under `apps/desktop/src/`
- 68 test files (assertions **and** regex literals)

**Only string-literal and regex contents were touched**, so identifiers survive by
construction: `HermesNotification`, `hermes:` ipc channels, `/api/hermes/...`
routes, localStorage keys, `--stroke-nous` CSS variables, and
`https://discord.gg/NousResearch` (word-boundary matching protected it â€” there is
no boundary between `Nous` and `Research` in that host).

**Five hand-audited exclusions**, each for a correctness reason:

| Excluded | Reason |
|---|---|
| `i18n/*` **key names** (`restartHermes`, `titleNous`, `sshHermesPathTitle`) | Internal identifiers every `t()` call site uses. `types.ts` declares them. |
| `lib/provider-setup-errors.ts` | Its regex matches **backend-emitted** text (`No Minerva provider configured`). Renaming would silently stop detecting it. |
| `desktop-remote-auth.test.ts`, `boot-failure-reauth.test.ts` | Provider `displayName`s arriving from Python, not UI copy. |
| `find-in-page-scope.test.ts` fixtures | Deliberately mixed-case DOM text; renaming broke the case-insensitivity premise. |
| `data.identity.test.ts` fixture | `'hermes'` is a reserved token tied to the `@hermes` profile alias (`data.ts:1169`). |
| Lowercase `hermes` everywhere | In copy it is a real CLI command or path (`hermes gateway setup`, `hermes-agent`). |

**Window titles** (`electron/main.ts`) â€” four `title: 'Hermes'` became
`title: WINDOW_TITLE`, sourced from `PRODUCT_IDENTITY.displayName` rather than a
literal, so the Light and bundled variants label their own windows.
`index.html` `<title>` also changed (the loaded page's title otherwise wins).

**`locales/_keys.desktop.json` regenerated.** Key *paths* did not change, so this
was **already stale before this work** â€” the diff was 4 unrelated
`settings.billing.portalPlans.*` keys. Regenerating it also unblocks
`hermes plugins validate` for language packs.

### Bugs this work caught

| Bug | Fix |
|---|---|
| `stale-aux-dismissal.test.ts` asserted `'  Nous '` normalises to `'nous'` â€” renaming the input broke the equality | Restored as `'  NOUS '`, preserving intent without the brand |
| `commit-changelog.ts` excluded as "just a commit template", but `updates-overlay.tsx:298` copies it to the clipboard for bug reports | Rebranded after checking the consumer |
| `i18n-keys --check` failed on 4 stale keys predating this work | Regenerated |

**Verified.** `tsc --noEmit` clean on renderer and electron. **1,296 tests across
91 affected files pass** (run in batches; the full `--project ui` run hangs on
this machine). 6 failures in `streaming.test.tsx` /
`status-invalidation-scope.test.tsx` were proven **pre-existing** by reverting the
brand strings in those two files and reproducing the identical 6 failures
(`Maximum update depth exceeded` from `@assistant-ui/tap`).

---

## 9. Portal origin â†’ `portal.abbble.co.za`

The renderer was already partly rebranded (`ABBBLE_PORTAL_ORIGIN`,
`FALLBACK_PORTAL_*`). Three production sites still pointed at Nous, plus 9
fixture/test files â€” 12 files total; `portal.nousresearch.com` now appears
**zero** times in `apps/desktop`.

| File | Note |
|---|---|
| `electron/main.ts:8204` | The one that matters â€” drives `GET /api/agents`, cookie-jar scoping, `hermes:cloud:status` |
| `electron/backend-health.ts:151` | cloud-down help prose |
| `src/app/pet-generate/.../generate-unavailable.tsx:32` | "Grab a key from" link |

**Deliberately untouched** â€” three *different* Nous services, not the portal:
`*.agents.nousresearch.com` (Cloud fleet), `hermes-agent.nousresearch.com`
(docs / skills / plugin catalog), `hermes-assets.nousresearch.com` (release
archive â€” see Â§5).

**Verified.** Both typechecks clean; 185 tests pass across billing,
`oauth-partition`, `backend-health`, `toolset-config-panel`, `boot-failure-overlay`.

---

## 10. Portal app â€” two missing endpoints

`minerva-monorepo/apps/portal`. Endpoint audit found the desktop's two direct
socket calls **already matched** byte-for-byte and needed no change:
`GET /api/portal/plans` (exact `AbbblePlan` shape + `access-control-allow-origin: *`,
which is load-bearing because the renderer fetches it cross-origin) and the
`device/start` + `device/poll` pair (201/200, `api_key`/`consumed`/`agency`).

Two gaps were real and are now implemented:

- **`packages/database/migrations/037_portal_agents.sql`** â€” new `agency_agents`
  table (`agency_id`, `name`, `dashboard_url`, `status`, cached `gateway_state`).
  RLS enabled with no permissive policies, matching the `035` device-codes
  posture. Safe to re-run. **Not yet applied to a database.**
- **`apps/portal/app/api/agents/route.ts`** â€” the full desktop contract:
  cookie-session auth, bare 401 on no user, agency resolved from the caller's
  *own* memberships with `?org=` only ever selecting among them (matched by **id
  or slug**, because the desktop's picker replays whichever it was given), 404
  `org_not_found`, 409 `org_selection_required` with the agency list, camelCase
  `dashboardUrl`/`dashboardGatewayState`.
- **`apps/portal/app/manage-subscription/page.tsx`** â€” honours `?plan=`; `/plans`
  already brands itself "Manage Subscription", so this names the requested tier
  and hands off rather than reimplementing checkout.

**Verified.** `tsc --noEmit` 0, `eslint` 0, `next build` registers
`Æ’ /api/agents` and `Æ’ /manage-subscription`.

### Still needed for Cloud to work

1. **Migration 037 has not been run.**
2. **No silent agent sign-in.** `cloudAgentSilentSignIn` (`main.ts:8365-8397`)
   opens `{dashboardUrl}/login` in the shared OAuth partition and relies on the
   agent auto-approving because the user already holds a live portal session.
   That `/oauth/authorize` endpoint lives on **each agent host**, not the portal.
3. **`gateway_state` has no writer.** Kept as a cached value with `'unknown'` as
   "never probed" so `/api/agents` stays fast enough for a settings panel; a
   health loop must write it.
4. **`isPersonal` is hardcoded `false`** â€” no solo-tenancy concept in this schema.
   The desktop never reads it, so the shape is kept whole rather than inventing a
   column.

---

## 11. Release-channel origin â†’ `minerva-assets.abbble.co.za`

### 11a. New app: `minerva-monorepo/apps/minerva-assets`

Minerva Desktop runs no conventional updater: a Windows install is an MSIX whose
update source is a `.appinstaller` descriptor that **Windows itself** resolves
(`win.target: ['msix']`, no NSIS anywhere), and macOS uses electron-updater
against `{channel}-mac.yml`. Both are reached through the custom signed channel
protocol.

| Route | |
|---|---|
| `GET /releases/channels/<channel>.json` | channel record; validated, `no-cache` |
| `GET\|HEAD /releases/<key>` | manifests (validated), feeds, artifacts (streamed) |
| `POST /api/publish` | the uploader â€” bearer token, constant-time |
| `GET /api/objects?prefix=` | authenticated listing (the publisher's `keys()`) |
| `GET /health` | liveness + resolved object source |

- **`lib/protocol.ts`** â€” the server-side twin of
  `apps/desktop/electron/updater/channel-protocol.ts` (the client decoder, which
  remains the authority). Shape only; trust decisions (identity equality,
  version/sequence binding, signing identity, immutable key prefixes) stay
  client-side, so passing validation never means "safe to install".
- **`lib/storage.ts`** â€” two dependency-free drivers: `MINERVA_ASSETS_ROOT`
  (directory, and the **only** writable one) or `MINERVA_ASSETS_BUCKET_URL`
  (public HTTPS bucket, read-only).
- **`lib/auth.ts`** â€” one token from the environment, compared as fixed-length
  SHA-256 digests under `timingSafeEqual`. Unset token â‡’ **no publish path at
  all** (503), never an open one.
- **`lib/writer.ts`** â€” temp file in the same directory â†’ `fsync` â†’ `rename`;
  immutable build prefixes are never overwritten (identical bytes = 200 no-op,
  different bytes = 409); channel records are the only mutable object; S3-style
  `If-Match` / `If-None-Match: *` preconditions so the publisher's CAS loop works
  unchanged.

**Why the origin validates at all:** the desktop's resolver has **no fallback for
a malformed body**, so a bad record takes the channel offline fleet-wide with no
"stay on your current build" path. A broken publish is a `422` to the publisher;
anything that reached the object root by another route is `502` rather than
served.

**Verified.** `tsc` 0, `eslint` 0, `next build` registers all six routes, and
`scripts/smoke.mjs` boots the real server against a temp root â€” **34/34 checks
pass**, including a `bundleEnv` injection attempt (`LD_PRELOAD`), a traversal key,
a reserved Windows name, an immutable-overwrite conflict, stale-ETag 412, and a
byte-for-byte artifact round trip.

Three real bugs the smoke test caught, all invisible to typecheck:

| Bug | Fix |
|---|---|
| `fsync` on a read-only handle is `EPERM` on Windows (fine on Linux) â€” every publish failed | Open `r+` |
| A catch-all param excludes its static parent, so every key was missing the `releases/` prefix â†’ 500 | Re-prepend `releases` |
| The manifest route consumed the stream for validation, then returned the exhausted stream â†’ empty body | Reply from the buffer |

### 11b. Publisher origin

`scripts/releases/r2.py` `DEFAULT_PUBLIC_URL` â†’ `https://minerva-assets.abbble.co.za`,
with the two assertions in `tests/scripts/test_release_r2.py` updated. Verified
by import.

### 11c. Source updates â€” env-overridable

`hermes_cli/source_releases.py` hardcoded `_PUBLIC_BASE`, so `hermes update`'s
git/channel path would still have read from Nous. Now:

```python
DEFAULT_PUBLIC_BASE = "https://minerva-assets.abbble.co.za"

def public_base() -> str:
    from hermes_cli.release_channels import public_base as validate_public_base
    raw = os.environ.get("MINERVA_ASSETS_PUBLIC_URL") or os.environ.get("CLOUDFLARE_R2_PUBLIC_URL")
    return validate_public_base(raw) if raw and raw.strip() else DEFAULT_PUBLIC_BASE
```

`MINERVA_ASSETS_PUBLIC_URL` is the fork's own name; `CLOUDFLARE_R2_PUBLIC_URL` is
honoured so existing release CI keeps working. Read at call time, never import
time, and validated on every read. `OFFICIAL_REPOSITORY` â†’ `abbbleco/minerva`.

**Verified:** default resolves to the new host, both env vars honoured, a bad URL
raises `ChannelError` rather than falling back.

### 11d. Publisher write path â†’ the origin

**New** `HttpChannelStore` in `scripts/releases/channels.py`, alongside
`R2ChannelStore`, with the same three operations (`get` with ETag, compare-and-swap
`put`, `keys`) so `ChannelPublisher` is unchanged by which store it gets. Status
mapping is deliberate: **412 â†’ `ChannelConflict`**, 409/422 â†’ terminal with the
origin's reason, 401/403 â†’ unauthorized, 503 â†’ "origin not configured", **5xx â†’
"outcome uncertain"** (a lost response is not a conflict; the write may have
landed).

`channel_publish.py` now selects via `channel_store()`: `HttpChannelStore` when
`MINERVA_ASSETS_PUBLISH_TOKEN` is set, otherwise `R2ChannelStore` â€” so an existing
R2-configured pipeline keeps working unchanged. The token is read from the
environment, never argv.

**New** `tests/scripts/test_release_http_store.py` â€” 23 tests covering the client
contract. No pytest in the available interpreter, so they were executed through a
throwaway shim: **23 passed, 0 failed**.

One bug this caught: the `opener` seam was set but never called, so the tests were
making **real network requests** to `minerva-assets.abbble.co.za`. Fixed by routing
every operation through the seam and moving the `Authorization` header into the
callers, so an injected transport observes exactly what would go on the wire.

---

## 12. Brand replacement: `NousResearch/hermes-agent` â†’ `abbbleco/minerva`

Applied across **317 files**. Includes product code, the desktop app, CI
workflows, issue/PR templates, tests and fixtures, and the docs site.

**One file deliberately restored:** `website/src/data/userStories.json` (38
occurrences) holds **real users' issue links** quoted as testimonials
(`@Bichev` â†’ `issues/4379`, `@jgravelle` â†’ `issues/10409`, â€¦). Repointing them at
`abbbleco/minerva` would produce 38 dead links and falsify real people's quotes.
Reverted. (The file is gitignored via `.gitignore:36 data/`, so it was restored by
reversing the substitution, not `git checkout`.)

**Known overreach from a faulty exclusion filter** (anchored patterns like
`^website\` do not match absolute paths), now included in the 317 and worth a
review pass:

| Area | Files |
|---|---|
| `website/docs/**`, `website/i18n/**`, `website/scripts/**` | 147 |
| `evals/**`, `plugin-catalog/**`, `skills/**` | 12 |

These were intended to be excluded. The docs changes are correct in substance;
`plugin-catalog/*.yaml` and `skills/**/SKILL.md` may point at third-party upstream
projects and deserve a human look.

---

## 13. Deliberately NOT changed

Each of these would break or falsify something if changed blindly.

| Item | Why |
|---|---|
| `pm/artifact-mirror.json` origin + `scripts/install.sh` / `install.ps1` `UV_PIN_MIRROR` (10 URLs) | These are **content-addressed** `upstream/sha256/<digest>` blobs. Repointing to the new host before mirroring those objects **breaks the installer**. Mirror first, then flip. |
| `.github/workflows/install-e2e-{macos,windows}-run.yml` defaults | The **bootstrap installer** (`Hermes-Setup.dmg/.exe`) is a different artifact class, served from the archive root. The new origin serves `/releases/**` only, so these would 404. |
| `hermes_cli/default_soul.py`, `banner.py`, `cli_render.py`, `skills_hub.py`, `model_switch.py` | The **Python backend** still says *"You are Minerva Agent, built by ABBBLE CO"*, so the agent introduces itself as Minerva in chat. Outside the frontend-UI scope, but user-visible. |
| `electron/main.ts` dialog copy (`'Hermes update'`, `'Sign in to Minerva gateway'`, crash dialog), `notification-ipc.ts:46` | Electron-side, outside the frontend-UI scope. |
| `*.agents.nousresearch.com`, `hermes-agent.nousresearch.com` | Different Nous services (Cloud fleet; docs/skills/plugin catalog). |

---

## 14. Repository layout note

`minerva-monorepo` is a **nested git repo with no `.gitmodules`**, tracked by the
product repo as a gitlink (mode `160000`). Its `origin` currently points at
`https://github.com/abbbleco/qontxt.git` â€” almost certainly a copy/paste error.

- Product repo remote: `https://github.com/abbbleco/minerva.git` âœ“
- Monorepo contains the new `apps/minerva-assets` (committed locally as
  `ac0aab7 minerva-assets`) but has no correct remote, so **that work is not
  pushed anywhere**.
- The product repo's gitlink has not been moved to `ac0aab7`.

**Before pushing:** fix the monorepo remote, and decide whether to add a proper
`.gitmodules` entry or vendor the monorepo into the product repo.

---

## 15. How to verify this branch

```bash
# icons: 85 targets regenerate and --check is clean
HERMES_PYTHON="$PWD/.venv/Scripts/python.exe" node scripts/generate-icons.mjs --check

# release origin: boots the real server, 34 checks
cd minerva-monorepo/apps/minerva-assets && npm run build && node scripts/smoke.mjs

# portal app
cd minerva-monorepo/apps/portal && npx tsc --noEmit && npx next build

# desktop: renderer + electron typechecks
node_modules/.bin/tsc -p apps/desktop/tsconfig.json --noEmit
node_modules/.bin/tsc -p apps/desktop/tsconfig.electron.json --noEmit

# publisher client contract (needs pytest; not in .venv)
python -m pytest tests/scripts/test_release_http_store.py tests/scripts/test_release_r2.py

# source-update origin resolution
python -c "import hermes_cli.source_releases as s; print(s.public_base(), s.OFFICIAL_REPOSITORY)"
```

---

# Session 3 — management-plane ports (ABBBLE equivalents)

The inference link was repointed in Session 2. This session ports the
management-plane APIs the Python backend calls, so nothing resolves to Nous.

## 16. /api/oauth/account (new)

minerva-monorepo/apps/portal/app/api/oauth/account/route.ts. Projects the
ABBBLE model (Supabase Auth + agencies + subscriptions) into the exact shape
hermes_cli/nous_account.py parses: user, organisation, paid_service_access,
subscription, 	ool_access, ccount_tier, managed_tools.

Accepts either credential the backend holds: a Supabase JWT (verified, then
first active membership becomes the org) or a router qkt_sec_* key (hashed,
looked up in gency_api_keys; user is null and the client falls back to the
org id, exactly as for a key-only Nous credential).

Deliberate non-features: 	ool_access always disabled with empty coverage,
managed_tools always false (no managed tool pool to claim), ccount_tier
always "standard" (free tier is a *plan*, not an identity; only the guest
identity renders the free-tier view and it never reaches this endpoint).

Python: hermes_cli/nous_account.py:154,484 defaults repointed. The call path
(/api/oauth/account) already matched, so no path change was needed.

## 17. /api/nous/recommended-models (new)

minerva-monorepo/apps/portal/app/api/nous/recommended-models/route.ts.
Returns curated {paid,free}RecommendedModels: [{modelName}] plus the four
compaction/vision picks ({modelName} | null), every id a router wire id the
router actually serves. Curated by hand, not derived — a recommendation is a
human pick. Free vision is 
ull (no free-tier model advertises vision input;
null beats a guess, and the client already handles it).

Python: hermes_cli/models.py:379,416 fallbacks repointed. The fetch path
(/api/nous/recommended-models) already matched.

## 18. /api/billing/* (new: 2 reads + 7 typed stubs)

Reads are adapters over agencies/subscriptions/ledger, with tier rows from
@minerva/billing (the same source the portal's own /plans renders, so the
desktop, website and API can never disagree on a price):

- GET /api/billing/state — balance, usage, org, role; card/charge_presets/
  monthly_cap/uto_reload are null/empty, can_charge and
  cli_billing_enabled are false.
- GET /api/billing/subscription — plan, tiers, usage; can_change_plan false;
  context is personal/	eam from member count.

Mutations (charge, charge/[id], uto-top-up, subscription/preview,
pending-change PUT/DELETE, subscription/upgrade) return typed 501
{"error": "endpoint_unavailable"} with a portal_url, via the shared
pp/lib/billing-unavailable.ts helper. There is no card processor behind this
API — top-ups and plan changes happen on the website (/manage-subscription),
where payment completes in the browser. A typed refusal lets the backend map it
to the "go to the portal" action instead of crashing on an HTML 404; the
credential is still validated first, so unauthenticated callers learn nothing.

Python: hermes_cli/nous_billing.py:19 default repointed. Call paths already
matched.

## 19. /api/anonymous/* (new: create, token, promotion-intent, promotion-status)

Guest access without sign-up, backed by a new portal_anon_grants table
(migration  38_portal_anon_grants.sql — grant-hash only, salted IP throttle,
RLS with no permissive policies, safe to re-run).

- create returns {user_id, org_id, token, idle_ttl_days}; the token starts
  with non_ (the client requires the prefix) and is shown once.
- 	oken exchanges once for {access_token, expires_in, inference_base_url,
  user_id, org_id}. The access token IS the guest router key (opaque to the
  client, which falls back to expires_in for expiry and defaults the tier to
  anonymous). Replays report consumed without minting a second key.
- promotion-intent links a grant to a device flow the user started elsewhere;
  promotion-status observes that flow (pending/completed/denied/
  expired). Completion is observed, not performed — the device approval mints
  the real credential and the client settles onto it.

The ABBBLE guest model is single-step (mint a key) where Nous was four-step
(create → token → promotion-intent → promotion-status with account transfer).
The four endpoints preserve the client's expected shapes; what changes is that
there is no account transfer server-side to observe beyond the device approval.

Python: no change needed — non_auth.py resolves via the shared default
(already ABBBLE), and the response shapes match what its parsers require
(non_ prefix, ccess_token presence, claim_code presence).

## 20. OAuth authorize + token + JWKS (new)

Full authorization-code + PKCE server for first-party clients (the local
dashboard), because the dashboard plugin verifies ud = bare client_id,
iss = portal origin, and oauth_contract_version = 1 against JWKS:

- Migration  39_portal_oauth.sql: portal_oauth_clients (registered
  client_ids with exact redirect URIs — no open registration),
  portal_oauth_codes (single-use, 10 min, PKCE-bound), and
  portal_oauth_refresh_tokens (24h, rotating; presenting a consumed token
  revokes the chain, which is how a stolen refresh is contained). Seeds the
  minerva-dashboard client with loopback redirect URIs. Safe to re-run.
- GET /oauth/authorize validates client/redirect/challenge, sends unsigned
  users to login (with 
ext back), signed-in users to /oauth/consent.
  Malformed requests are JSON errors, never redirects to unregistered URIs.
- /oauth/consent renders what the client asked for; the form POSTs the
  decision back. Deny redirects with ?error=access_denied.
- POST /api/oauth/token (form-encoded, as OAuth clients send): code exchange
  (verifies liveness, PKCE, redirect binding, then consumes) and refresh
  rotation (link-then-consume ordering so a crash never strands the client).
  Access JWTs carry exactly the claims the plugin checks.
- GET /.well-known/jwks.json publishes the public key (cacheable; rotation
  is additive).
- pp/lib/oauth-jwt.ts: ES256 with node:crypto only (raw R‖S, not DER);
  key from OAUTH_JWT_PRIVATE_KEY_PEM, stable kid = public-key thumbprint.
  Documented in .env.example with the generation command.
- Login/signup pages now accept ?next= so an authorize flow interrupted by
  sign-in resumes instead of landing on /minerva.

Python: plugins/dashboard_auth/nous/__init__.py:33 default repointed. Its
_token_url (/api/oauth/token) and _authorize_url (/oauth/authorize)
paths already match the new routes.

## 21. Artifact mirror (ops, not code)

pm/artifact-mirror.json, scripts/install.sh, scripts/install.ps1 still
point at hermes-assets.nousresearch.com/upstream/sha256/* because those 10
pinned blobs must EXIST on the new host before the flip — otherwise the
installer breaks. Mirror each object byte-for-byte, verify SHA-256, then flip:

\\\
for digest in 0643b9fb… 0db54010… 4343217d… 4c9f5226… 546f7f8a… \\
              600cf9a7… b23350c7… b365da79… bb66cb52… fa513fca…; do
  curl -fsSL \"https://hermes-assets.nousresearch.com/upstream/sha256/\\" \\
    -o "/srv/minerva-assets/upstream/sha256/\"
  echo "\  /srv/minerva-assets/upstream/sha256/\" | sha256sum -c -
done
\\\

(Full digests in scripts/install.sh:179-204 and install.ps1:83-102; the
minerva-assets app serves any key under 
eleases/ and, with
MINERVA_ASSETS_ROOT pointed at the same tree, these paths resolve without a
code change.) Only after all ten verify: flip the three origins, then the two
install-e2e workflow defaults (bootstrap installer — a separate artifact class
the origin does not serve; those two stay until the setup binaries are
published to the new host).

## 22. Deliberately still on Nous

| Item | Reason |
|---|---|
| DEFAULT_NOUS_WELCOME_URL (welcome-api.nousresearch.com) | Free-tier anonymous inference host. The ABBBLE guest model mints router keys instead of JWTs, so there is no welcome-host equivalent; changing it would point guest inference at a host that cannot serve it. Retire with the guest flow, not before. |
| models.py recommended-models *path* | Now served by §17; the path itself (/api/nous/recommended-models) is the contract and stays. |
| hermes-agent.nousresearch.com (docs/skills/catalog), *.agents.nousresearch.com (Cloud fleet), discord.gg/NousResearch | Different services, not the portal. |

---

# Session 4 — migrations 034–039 applied

\pnpm --filter @minerva/database db:generate\ (Session pooler, \DATABASE_URL\
from \minerva-monorepo/.env.local\) applied 6 migrations: 034 (fixed, see
below), 035, 036, 037, 038, 039. Verified: all 5 new tables exist with RLS on,
\minerva-dashboard\ OAuth client seeded, all six recorded in
\_minerva_migrations\.

## 034 ordering bug (pre-existing, found by the run)

\ 34_portal_tiers.sql\ updated rows to \'plus'\ while the 030 CHECK
constraint (\'free','pro','agency'\) was still in place — every touched row
failed with "new row violates check constraint". Fixed by reordering only
(drop both old constraints → migrate data → add new constraints); the end
state is identical. The failed attempt rolled back cleanly (one implicit
transaction) and was never recorded, so the retry ran the corrected file from
scratch. Same latent bug shape existed for \gencies\ in the same file.

## Notes

- The direct \db.*.supabase.co:5432\ hostname does not resolve from here;
  migrations require the **Session pooler** (\ws-0-*.pooler.supabase.com:6543\).
  Transaction-mode poolers reject the multi-statement files; Session mode is
  required, matching the runner's \max: 1\ comment.
- Guest keys now stamp \expires_at\ (24h) in both \nonymous/token\ and
  \portal/guest/mint\, matching the lifetime the clients are told. The router
  already enforces the column; previously the rows lived forever.


---

# Session 5 — router deploy fix, portal auth, inference migration, welcome-api

## 23. Router Vercel build fix

Vercel failed with 19 errors, all one root cause: `@minerva/billing` and
`@minerva/database` hand out TypeScript source (`exports` points at
`./index.ts`), and the router compiled that source under its own `NodeNext`
options — where extensionless ESM imports are a hard TS2835 error. Every
TS2305 "has no exported member" was fallout; none was a real missing export.

- `apps/router/tsconfig.json`: `module`/`moduleResolution` NodeNext to
  ESNext/bundler. Matches both runtimes (Docker runs via tsx, Vercel bundles
  the function) and matches what `packages/*/tsconfig.json` already use.
- `turbo.json` `globalEnv`: added the 9 vars Vercel warned would otherwise be
  unavailable to the application.
- `apps/router/public/robots.txt` (new): the router is API-only, so no static
  site is ever produced and Vercel's required Output Directory did not exist.
  `Disallow: /` — an API service is not a website; `/api/*` still hits the
  function.

Verified: reproduced the exact errors locally, then `turbo run build
--filter=@minerva/router` reports 2 successful; the app boots (`GET /health`
returns 200); billing tests pass 2/2. Vercel project itself still pointed at
the wrong repo when diagnosed — Repository must be the product repo with Root
Directory at the vendored monorepo, or fixed code never deploys.

Left as a follow-up: `packages/database` declares `"turbo": {"build":
{"outputs": []}}` while emitting to `dist`, and nothing consumes that `dist`.
That source-leaking shape is what made this bug class possible; pointing
exports at built output changes every consumer and belongs in its own change.

## 24. Portal auth: Google + GitHub only

Portal sign-in (shared `AuthCard` for `/login` and `/signup`) offered Microsoft
(Supabase `azure`) and a Continue with ChatGPT link alongside Google and
GitHub. Both removed; what remains is email OTP plus two real OAuth providers,
all through Supabase Auth.

- `app/components/auth-card.tsx`: `oauth()` narrowed to Google and GitHub.
  Google sends scopes `openid email profile` with `access_type: offline` and
  `prompt: consent`; GitHub sends `read:user user:email`. Per-provider busy
  state included.
- `app/auth/callback/route.ts` (new): exchanges `?code=` for a session and
  redirects to a validated `?next=` (internal paths only). Previously every
  flow redirected straight to `/minerva`, so the session was never established
  server-side.
- `app/login/page.tsx`, `app/signup/page.tsx`: accept `?next=` and pass it
  through, so an authorize flow interrupted by sign-in resumes instead of
  landing on `/minerva`; callback failures arrive as `?error=` and render on
  the form.
- `app/help/page.tsx`: copy now reads Email plus Google/GitHub.

Verified: `tsc` clean, `eslint` clean, `next build` registers the callback
route plus login and signup.

Dashboard action that code cannot do: Supabase → Authentication → Providers —
enable Google and GitHub (Azure can now be switched off), with redirect URLs
for the portal host plus localhost in the allow-list, or every flow fails with
a redirect error no code change can fix.

## 25. Inference link to Minerva router, single provider

The desktop never calls inference directly; the backend provider registry does.
The `nous` row was labelled "ABBBLE Portal" while its inference URL pointed at
the Nous inference API, and the portal-host allowlist silently fell back any
stored ABBBLE URL to Nous.

The row keeps its id — hundreds of files key on the `"nous"` provider id, so
renaming it would be a migration rather than a rebrand. The id is just a key;
everything it resolves to is now ABBBLE. There is no second Nous provider.

- `hermes_cli/auth_constants.py`: portal default now points at the ABBBLE
  portal host, inference default at the Minerva router `/v1`. The welcome-host
  default was left for §26, which retires it properly.
- `hermes_cli/web_routers/oauth.py`: the `"nous"` starter switched from the
  Nous device-code flow (whose token endpoint does not exist on the ABBBLE
  portal) to the ABBBLE device flow. A URL-only repoint would have broken
  sign-in entirely; the flow had to move with the URLs. The poller travels
  with the session, so in-flight logins are unaffected; old refresh-token
  sessions decay naturally and re-login through the new flow.
- `hermes_cli/auth.py`: the new portal host admitted to the allowlist and the
  old Nous portal host removed — stale stored Nous URLs now fall back to
  ABBBLE (migration) instead of working against Nous. The stale-host migrator
  only knew the old API host, so this fallback is the path old installs
  actually take.
- `hermes_cli/auth_nous.py`: the router host admitted to the JWT-forwarding
  allowlist (refresh responses naming it would otherwise be rejected);
  legacy Nous hosts kept so in-flight sessions refresh instead of breaking.
- Four more inference defaults saying the same thing (`providers.py`,
  `models_pricing.py`, `agent/auxiliary_client.py`, `agent/usage_pricing.py`).
- `plugins/model-providers/nous`: base URL to the router, display name to
  Minerva, signup to the portal; registry name and old aliases kept so
  existing configs resolve.
- `plugins/dashboard_auth/nous`: default portal URL repointed (its token and
  authorize paths already match the new OAuth routes).

Verified by import: the registry `nous` entry resolves to the ABBBLE portal
plus the router `/v1`, and both starters map to the ABBBLE flow. Tests
asserting old defaults updated; everything passing explicit URLs (refresh and
poll mocks, JWKS fixtures, host-matcher units, the client-rebuild mock) left
alone — those test logic, not defaults.

Deliberately not repointed (no ABBBLE equivalent exists; changing them breaks
the feature instead of migrating it): the billing API surface, the model
recommendations path, guest promotion in `anon_auth`, the artifact mirror plus
installer mirrors (objects must be mirrored first), and the other Nous hosts
(agents fleet, docs and skills site, support chat link), which are different
services.

## 26. Welcome-api (new app: `minerva-monorepo/apps/welcome-api`)

The last Nous default was the free-tier fallback host. The guest model here
mints router keys rather than JWTs, so there is no welcome-host equivalent to
adopt — instead there is a new origin for the fallback to point at.

Design: a policy gate in front of the router, not a second inference engine.
It authenticates the guest credential, enforces free-models-only, then relays
to the router with the caller's own Authorization header intact, so metering,
ledger and attribution land exactly as a direct call. No upstream credentials
held, no ledger rows written. That matches why the welcome host exists at all:
the Python fallback needs a stable origin whose only promise is free tier.

- `src/policy.ts`: Bearer must be an active, unexpired router key whose agency
  has no paid subscription — paid keys are rejected (serving them free models
  would silently downgrade what they paid for). Requested model must be in the
  free set (same variable plus wire-ID format the billing package uses; either
  spelling the router would honour), else 402 with the allowed list — the same
  code the router returns, so clients need no second error path. Omitted model
  passes through (the router's free meta-router always resolves inside the
  free set).
- `src/app.ts`: health, models (free only, no prices — the price here is
  always zero), chat completions streaming and not; malformed JSON is a local
  400, never a relayed 502; hop-by-hop headers stripped, request id preserved
  for idempotent retries.
- Entry points mirror the router (`src/index.ts` for Docker/tsx,
  `api/[[...route]].ts` for Vercel) including the corrected relative depth and
  bundler module resolution from §23, plus Dockerfile, vercel config, env
  example and README.
- Python: welcome default now points at the new host; the welcome-host set
  contains only it (which is what makes route pinning, model pinning and
  free-tier banners trigger); the new host admitted to the JWT-forwarding
  allowlist; 14 test fixtures updated (all use it as "a welcome-host URL",
  which is exactly what routing logic keys on — paid fixtures left alone
  since not-welcome is their whole job).

Verified: typecheck clean; `scripts/smoke.mjs` boots the real server against
stub Supabase plus stub upstream — 13 of 13 green: health, free-only catalog,
the three 401 shapes, paid-key rejection, non-free 402 with allowed list,
byte-identical relay with credential and request id forwarded intact, both
model-id spellings, omitted model, malformed JSON rejected locally. Source
tree has zero remaining references to the old welcome host; the cross-refusal
message tests now simulate the new server telling clients to use the new host,
which is what a real refusal will say.

## 27. How to verify this session

Router (the exact Vercel failure, reproduced then fixed):

    pnpm turbo run build --filter=@minerva/router   # was 19 errors, now 2 successful

Portal auth:

    cd minerva-monorepo/apps/portal && npx tsc --noEmit && npx next build
    # registers the auth callback; login and signup accept ?next=

Provider resolution (product repo):

    python -c "from hermes_cli.auth import PROVIDER_REGISTRY as r; n=r['nous']; print(n.portal_base_url, n.inference_base_url)"
    # ABBBLE portal host plus router /v1

Welcome-api:

    cd minerva-monorepo/apps/welcome-api && npx tsc --noEmit && node scripts/smoke.mjs
    # 13 of 13 against stub Supabase plus stub upstream

Welcome fallback:

    python -c "from hermes_cli import anon_auth; from hermes_cli.auth_constants import DEFAULT_NOUS_WELCOME_URL as u; print(u, sorted(anon_auth.welcome_hosts()), anon_auth.route_is_welcome_host(u+'/v1'))"
    # new host, single-entry set, True

---

# Session 6 — AGENTS.md: fork identity + edit log rule (2026-10-05)

Two additions to the root `AGENTS.md`, no code touched:

- Fork notice under the title: this tree is a Minerva Agent clone/fork
  rebranded as Minerva (`github.com/abbbleco/minerva`, branch `main`), with
  product identity (names, default origins, provider defaults) pointing at
  ABBBLE infrastructure. Inherited engineering rules apply unchanged; upstream
  paths/accounts/hosts named in rules read as their fork equivalents.
- New bullet in Commits/Merges/PRs: every edit session that changes tracked
  files must append a dated `CORE_EDITS.md` section (what changed and why;
  never rewrite or delete earlier sections), covering renamed identities and
  origins, added endpoints with contracts, migrations written and applied or
  not, deliberate non-changes with reasons, and exact verify commands plus
  results.

Verify: `git diff --stat -- AGENTS.md CORE_EDITS.md` shows only these two files.

---

# Session 7 — welcome-api Vercel output dir (2026-10-05)

Same failure mode as the router in §23: Vercel requires an Output Directory
(\public/\) after the build, but the app is API-only (Hono behind
\pi/[[...route]].ts\) so nothing ever created one — and git does not track
the empty scaffolded \public/\ dir, so Vercel's clone had no \public/\ at
all.

Fix, mirroring §23: \minerva-monorepo/apps/welcome-api/public/robots.txt\
with \Disallow: /\ (API service, not a website; \/api/*\ still hits the
function). One file, invisible to \	sc\ (include globs are \**/*.ts\ only).

Verify: redeploy; the \No Output Directory named "public"\ error clears the
same way the router's did.

---

# Session 8 — function timeout 60 to 240, router + welcome-api (2026-10-05)

Long chat streams were at risk of being killed mid-stream at the old 60s
ceiling (the welcome-api relay timeout is 300s, but the function dies first,
so the function limit was always the real ceiling).

Set to 240 in all four places that must agree (route export + \ercel.json\
functions block, per app): \pps/router/api/[[...route]].ts\,
\pps/router/vercel.json\, \pps/welcome-api/api/[[...route]].ts\,
\pps/welcome-api/vercel.json\. The welcome-api config previously read 65
while everything else read 60 — aligned to 240 with the rest rather than
preserved.

Verified: welcome-api \	sc\ clean, router \	ypecheck\ exit 0. Change is
numeric literals only; no behavior change besides the ceiling.

---

# Session 9 — Agency tier card + contact-sales via Mailtrap (2026-10-05)

Plans page gains a full-width AGENCY card (the sales-led legacy tier: custom
volume, invoicing, onboarding — no self-serve Subscribe button, a conversation
instead) with an inline contact form plus a mailto:sales@abbble.co.za fallback.

- \minerva-monorepo/apps/portal/app/plans/agency-card.tsx\ (new, client):
  two-column card (pitch + form); fields name / work email / company / team
  size / notes; per-button busy state; success panel; honeypot field rendered
  invisibly and never tabbable.
- \minerva-monorepo/apps/portal/app/api/contact-sales/route.ts\ (new):
  strict validation with small caps; honeypot accepted-and-discarded with
  success so bots cannot probe the shape; per-IP throttle (5/hour) backed by
  a hash-only table; delivery via Mailtrap sending API (fetch, no SMTP to
  hold open on serverless). Submitter goes in Reply-To header + body; sales
  replies to the human, never the no-reply sender. Missing Mailtrap config is
  an explicit 503 naming the email fallback.
- \packages/database/migrations/040_portal_contact_requests.sql\ (new, NOT
  yet applied): ip_hash + created_at only — never names, emails or messages.
  RLS on, no permissive policies, safe to re-run.
- \.env.example\: MAILTRAP_API_TOKEN (server-only), MAILTRAP_FROM_EMAIL
  (must be a Mailtrap-verified sender or every send is rejected — dashboard
  step, not code), MAILTRAP_FROM_NAME, SALES_TO_EMAIL (default
  sales@abbble.co.za).

Verified: tsc 0, eslint 0, next build registers ƒ /api/contact-sales; live
against \
ext start\: honeypot → 201 ok, bad email → 400, valid-but-uncon-
figured → 503 with the fallback message, /plans → 200 rendering the card.
The actual Mailtrap send needs a token and cannot be exercised from here.

---

# Session 10 — migration 040 applied (2026-10-05)

Ran \pnpm --filter @minerva/database db:generate\ equivalent
(\
ode packages/database/scripts/migrate.mjs\ with pooler DATABASE_URL):
\ 40_portal_contact_requests.sql\ applied, 1 migration. Verified afterwards:
table present, RLS on, columns exactly \id, ip_hash, created_at\ (no PII
columns by design), recorded in \_minerva_migrations\. The contact-sales
throttle behind \/api/contact-sales\ is now live.

---

# Session 11 — premium features plan (docs only, 2026-10-05)

New file \docs/premium-features-plan.md\ (new \docs/\ directory; the
Docusaurus site under \website/docs/\ is user-facing, so a build plan does
not belong there). Comprehensive implementation plan for five premium
features — Feeds, Ideas, Goals, PRDs, website form intake API — ordered by
dependency (Phase 0 shared foundations first, then 1 Ideas, 2 Feeds, 3 Goals,
4 PRDs, 5 form intake), each with data model, backend, UI, tests and
acceptance criteria plus cross-cutting rules (premium gating, i18n, repo test
law, no core growth, intake privacy).

Grounded in existing surfaces before writing: Bots roster pane
(\pps/desktop/src/plugins/minerva-bots/\), goal state machine
(\hermes_cli/goals.py\ + \goal_command.py\), kanban, cron scheduler,
gateway platform intake, billing entitlement, and the Qontxt
\pp/api/v1/intake/route.ts\ proxy pattern that Phase 5 mirrors. No code
changed; status line in the doc reads planning.

---

# Session 12 — premium model policy (docs only, 2026-10-05)

PRD creation (and all premium-feature model work) runs on the user's
configured provider/model, never a pinned model. Recorded in
\docs/premium-features-plan.md\ as a cross-cutting rule plus one-line
amendments in Phases 2 (summarizer), 3 (judge) and 4 (triage classifier,
drafting writer): invoke through the standard model-call path with its
fallback chains; if the configured provider lacks a needed capability,
degrade with a visible marker, never silently substitute.

Verified Phase 0 already complies: no model ids, provider names or pinned
defaults in \hermes_cli/intake.py\, \prd.py\, \ttachments.py\ or the
three \src/lib\ mirrors; audio goes through the configured STT provider
(\	ranscribe_audio(path, source="intake")\, model unset); images defer with
\
eeds_model_analysis\ for in-turn vision instead of calling any model.

---

# Session 13 — Phase 0 premium foundations (2026-10-05)

Entitlement (renderer \src/lib/entitlement.ts\ + tests; backend
\hermes_cli/nous_billing.py::PREMIUM_TIERS/is_premium_tier/current_tier_id/
require_premium_tier\ + \	ests/hermes_cli/test_premium_entitlement.py\):
paid tiers pass, everything else raises \PremiumRequiredError\
(\error="premium_required"\); both sides assert the identical tier set and
fail closed on unknown tiers. Renderer answers visibility, backend answers
access; the gate takes already-fetched state and never performs I/O.

Schemas: \hermes_cli/intake.py\ (IntakeEvent/IntakeAttachment, validation,
\rom_message_event()\ mapping only public MessageEvent fields —
\
aw_message\ never survives) + \	ests/hermes_cli/test_intake.py\;
\hermes_cli/prd.py\ (PrdDocument, draft→in_review→approved/rejected with
history audit, \	o_markdown\) + \	ests/hermes_cli/test_prd.py\; TS mirrors
\src/lib/intake.ts\ + \src/lib/prd.ts\ (validators) + tests.

Pipeline: \hermes_cli/attachments.py\ dispatcher (audio→configured STT,
text docs inline, images/non-text deferred with \
eeds_model_analysis\;
never raises, never inlines bytes, remote non-text decided from metadata
without downloading; SSRF guard: http(s) only, 25MB/30s caps) +
\	ests/hermes_cli/test_attachments.py\. No model ids or provider pins
anywhere (model policy, Session 12).

Verified: renderer tsc 0; vitest 37 passed (entitlement/intake/prd); Python
24/24 via shim runner (pytest unavailable in .venv, env must not be mutated).
Plan status line advanced to Phase 1.

---

# Session 14 — Phase 1 Ideas pane (2026-10-05)

New plugin \pps/desktop/src/plugins/minerva-ideas/\ (auto-discovered via
\contrib/plugins.ts\ glob, zero registry edits): \data.ts\ (12 cards,
structure-only; all verbal copy in locale bundles), \i18n.ts\ (full en,
chrome-only ja/zh/zh-hant with card bodies falling back to en per the
established chain), \launcher.ts\ (fresh session + composer draft, slash
starters through standard dispatch — one mechanism, no second dispatcher),
\ideas-pane.tsx\ (search, premium lock → shared billing-settings recovery),
\plugin.tsx\ (sessions-strip dock mirroring Bots).

Core touch: \common.ideas\ added to core catalog (en, types, de/es/fr/ja/ru/zh;
ar/zh-hant fall back). Uniform launch = new session + draft; user reviews and
sends, nothing executes on click.

Verified: renderer tsc 0; 68 tests pass across 8 files (pane render incl.
search/lock/upsell, launcher order + lock matrix, catalog invariants, i18n
completeness, entitlement/intake/prd mirrors); core i18n completeness 24 pass.

---

# Session 15 � Instagram feeds provider (2026-10-05)

Instagram joins the feeds provider table beside Facebook. Same token-only UX:
paste a token in the connect dialog, validate, poll. Graph API constraint is
load-bearing: media lives under the Instagram Business/Creator account id, so
the provider auto-discovers it via /me/accounts (first Page with a linked
instagram_business_account wins) on every poll � no cached ids to go stale on
relink; no linked account raises ProviderAuthError with the Business/Page
requirement spelled out (Reconnect, not backoff). Captions stand in for body
text (no video transcription); caption-less media skipped (no derivable title),
same rule as empty Facebook posts.

Backend (hermes_cli/feeds.py): fetch_instagram_feed + validate_instagram_token
+ _discover_instagram_account shared by both; register_provider("instagram").
_facebook_api gained a product: str = "Facebook" param so Instagram errors read
"Instagram rejected the credential" instead of Facebook. New PROVIDER_VALIDATORS
table (facebook, instagram) with register_validator(); the validate RPC reads
the table � a third provider adds rows, never branches. Sources list, provider
status, and connect/disconnect all already read known_providers()/
provider_token_env() (FEEDS_INSTAGRAM_TOKEN derives automatically).

Renderer (apps/desktop/src/plugins/minerva-feeds/): i18n.ts gains
providerInstagram + tokenHelpInstagram in type + all 4 locales (en/ja/zh/
zh-hant; FeedsMessages now exported); feeds-pane.tsx replaces both provider
ternaries with key tables (PROVIDER_LABEL_KEY, TOKEN_HELP_KEY) + exported
providerLabel()/tokenHelp() helpers � unknown ids fall through to the raw id /
generic placeholder. Picker, env bridge, and status were already generic.

Tests: 6 new Python (discovery+media mapping, end-to-end poll, unlinked-account
auth error, missing-credential reconnect, validate ok/empty/unlinked) with a
sequenced urlopen fake for the two-call poll; 2 new vitest (label/help lookup
matrix incl. unknown-provider passthrough).

Verified: renderer tsc 0; vitest minerva-feeds 12/12, catalog+panes 23/23;
Python 31/31 via shim runner.
---

# Session 16 � Phase 2 cron background polling (2026-10-05)

Phase 2's last open item: polls only fired from the pane. Now one `no_agent`
script job per profile (`Feeds background poll`, every 15m) runs the due
poll; per-source intervals + backoff stay in `poll_due`, so the tick is
frequent and each source still polls on its own cadence.

New: `cron/scripts/feeds_poll.py` (`run()` with the poll-RPC seams �
premium gate, `poll_due`, up to 5 ingest briefs via `call_llm` � plus
`main()`). Success prints NOTHING (empty stdout is the scheduler's silent
signal; unread counts update quietly in the pane, never via delivery); exit 0
covers non-premium, no-sources, and per-source failures (degraded on the
source row); only unexpected internals exit 1. New: `hermes_cli/
feeds_cron.py` (shim install + `sync_poll_job` reconcile: create on first
enabled source, pause-with-our-reason when none remain, resume only our own
pause, user-paused jobs never touched, foreign file under our shim name blocks
install fail-safe). The profile script is a version-stamped 5-line shim
importing the repo logic, so checkout updates apply without reinstalls. Router
add/patch/remove endpoints call sync after mutation; sync never raises, so a
broken cron store can't break source management.

Verified: 9 new tests in `tests/hermes_cli/test_feeds_cron.py` (sync matrix
+ script run/skip/model-failure/exit paths, real cron.jobs records, injected
fetcher/complete_fn); full feed suite 40/40; router + script imports OK.
Plan status advanced to Phase 3.

---

# Session 17 — Phase 3 Goals (2026-10-05)

Tracked goals with agent-detected completion. Extends the existing /goal
machine (`GoalManager`/`GoalState`/`GoalContract` + `dispatch_goal_command`)
rather than replacing it: the session loop stays the *execution* engine (one
active goal per session); a new per-profile *tracking* layer adds plural named
goals, an audit history, a confirmation inbox and a judge hook.

Backend — new `hermes_cli/goal_registry.py` (storage + transitions + migration
+ binding + detection + kanban bridge). One `state_meta` key
(`goals:registry:v1`) under the profile home, so profiles stay isolated and no
new DB is introduced. Statuses active/paused/pending-confirmation/complete/
abandoned with a legal-transition table; every change appends a history row
(trigger + detail + evidence) through the single `transition()` chokepoint.
`confirm`/`dismiss` are pending-only. Legacy single session goals
(`goal:<sid>` rows) migrate once per home per process (active/paused only).
Detection (`detect_completions`) proposes, never completes — except above a
high threshold when the default-off `goals.tracking_auto_complete` opts in
(`reopen` = undo); evidence must be an exact substring of the turn or nothing
is proposed; a turn with no tools never spends a judge call. `track_turn` +
`turn_tool_names` derive the tools-ran gate from the turn's own messages
(bounded by the last user message), so all three surfaces share one rule.
`dispatch_to_kanban` mints a work item (idempotency key = goal id) and records
the link — explicit, never automatic.

Wiring — `GoalManager.set/clear/mark_done/pause/resume` and the loop's own
`done` branch (`evaluate_after_turn`) call advisory `_tracking_bind(...)`
helpers that swallow every failure, so tracking can never break the goal loop;
the bound entry mirrors the session goal's status. Turn-end detection hooked
into all three post-turn sites: gateway `gateway/run_goals.py`
(`_post_turn_goal_tracking`, off-loop via `_run_in_executor_with_context`,
skips internal turns, notice via the existing post-delivery path), TUI
`tui_gateway/prompt_turn.py` (`_after_complete_turn`), CLI
`hermes_cli/cli_loops_mixin.py` (`_maybe_track_goals_after_turn`, registered in
`_tui_after_turn`). `/goal create|list|show|complete|abandon|confirm|dismiss|
reopen|dispatch` added to `dispatch_goal_command` (adapters only, no new
parser); `is_goal_control` covers the new verbs.

REST — new `hermes_cli/web_routers/goals.py` (premium-gated like feeds,
profile-scoped, `asyncio.to_thread`): list/create/show + complete/abandon/
pause/resume/confirm/dismiss/reopen/dispatch; mounted in `hermes_cli/
web_server.py`.

Renderer — new `apps/desktop/src/plugins/minerva-goals/` (plugin.tsx,
shared.ts, i18n.ts en/ja/zh/zh-hant, goals-pane.tsx with status chips, the
confirmation inbox, and per-status actions) + `apps/desktop/src/api/goals.ts`.
`common.goals` added to the core i18n catalog (types + all 7 locales).

Tests: `tests/hermes_cli/test_goal_registry.py` (26 — CRUD, transitions,
pending-only guards, migration, detection fixtures clear-complete/close-but-not/
no-tools/bad-evidence/paused/auto-complete/threshold, config invariant +
clamp + garbage fallback, /goal parity, kanban idempotency) and
`tests/hermes_cli/test_goals_router.py` (5 — HTTP E2E incl. 402 gate);
`apps/desktop/src/plugins/minerva-goals/*.test.tsx` (13 vitest).

Verified: Python 31/31 via the shim runner; vitest minerva-goals 13/13,
i18n 76/76 (catalog completeness), contrib 50/50; web server mounts all 10
`/api/goals` routes (OpenAPI-confirmed); legacy goal loop + /goal verbs
re-checked against the new bindings. Plan status advanced to Phase 4.

---

# Session 18 — startup crash fix: dangling `methods_feeds` import (2026-10-05)

`minerva`/desktop backend failed to start with a deeply nested
`fastapi.routing.merged_lifespan` traceback whose root was
`ImportError: cannot import name 'methods_feeds' from 'tui_gateway'`.

Root cause: the Phase-2 (feeds) work added `methods_feeds as _methods_feeds`
to BOTH the `from . import (...)` block and the `for _m in (...): _m.register(...)`
tuple in `tui_gateway/server.py`, but `tui_gateway/methods_feeds.py` was never
created. The module body therefore raised at import; because the failure hit
line ~3647 (before the tail of the module), the `atexit` `_shutdown_sessions`
callback then raised `NameError: _flush_sessions_before_exit` on the way out —
pure fallout, not a second bug.

Why remove rather than create the module: feeds is an HTTP REST surface
(`hermes_cli/web_routers/feeds.py` + `apps/desktop/src/api/feeds.ts` via
`hermesApi`, which is a path-based REST proxy). No surface calls any
`feeds.*` JSON-RPC method — verified by repo-wide grep — so a `methods_feeds`
module would be speculative infrastructure, which the footprint ladder
rejects. Reverted the two added lines to match the pre-feeds server.py.

Verification: `ws.app.router.lifespan_context` enters cleanly; a real
`uvicorn.Server` boot on a free port reports `started: True`, serves
`/openapi.json` 200 with all 10 `/api/goals` paths, and shuts down clean;
AST scan confirms every one of the 46 relative modules referenced by
`tui_gateway/server.py` exists; 11-module import smoke (tui_gateway.server,
hermes_cli.web_server, goal_registry/goal_command/feeds/feeds_cron,
web_routers.goals/feeds, gateway.run_goals, tui_gateway.prompt_turn,
cli_loops_mixin) all OK.

Note: the existing `tests/tui_gateway/test_tui_gateway_server.py` does
`from tui_gateway import server`, so the suite already catches this class of
break at import — it simply wasn't run before the commit. No new test added
(a source-scanning guard would be a change-detector).

Also noted: the editable install at
`%LOCALAPPDATA%\hermes\installs\…\workspace` is a stale 2026-10-03 snapshot
(no feeds/goals). A dev run resolves repo code with that venv's packages, so
the repo fix is what the running app picks up; a packaged/installed launcher
would need a re-provision to gain both this fix and the feeds/goals features.
---

# Session 19 � Phase 3 verify + goals-pane tsc fix (2026-10-05)

User completed Phase 3 on the Session-16 registry foundation (committed as
`f95e5269 feeds, ideas, goals`: detection, dispatch parity, REST router,
minerva-goals pane, kanban bridge, Sessions 17-18 logged, plan already at
Phase 3 done). Verification found renderer `tsc` red: 4x TS2554 in
`goals-pane.test.tsx` � the same untyped-`vi.fn` mock shape as the feeds
pane (zero-arg implementations invoked with args). Fixed by typing the mock
params (`_body: unknown` / `_id: string`); no production code touched.

Verified: renderer tsc 0; vitest minerva-goals 13/13; Python 34/34
(test_goal_registry + test_goals_router via shim). Fixture-based goal suites
(test_goals.py, gateway goal tests) remain CI-only � no pytest in .venv or
system python. Plan status already correct; no plan change.
---

# Session 20 � Phase 4 PRDs (2026-10-05)

The flagship: intake ? triage gate ? drafting ? review queue ? kanban, with
intelligence concentrated in triage (never a PRD per conversation) and the
Phase-5 form seam designed in, not on.

Backend � new `hermes_cli/prd_store.py` (intake log with cited-first prune
cap + PRDs + triage cases under `<home>/prds/`), `prd_triage.py`
(scalar-strength judge, thresholds in config not prompts, LLM dedupe against
capped PRD titles � no embedding client exists in-tree; unparseable fails to
watch), `prd_drafting.py` (writer with strict schema + citation validation;
section_sources ride the triage case, schema frozen), `prd_pipeline.py` (ONE
`ingest_intake` every surface shares � gateway hook, dashboard REST, future
portal; sync-store/async-triage split for the Phase-5 latency budget;
`review_prd` with auto-hop approve/reject; `dispatch_approved`
approved-only, idempotent via case link + history note + kanban
idempotency_key). Additive `PrdDocument.revise_section` (terminal frozen).
New `hermes_cli/prd_command.py` (list/show/approve/reject) wired as `/prd`
on CLI + gateway mixin + TUI method + `_IDLE_COMMANDS` + help subgroup +
regenerated desktop slash dump. Gateway turn hook in `run_goals.py`
post-turn table (skips internal + slash-command turns, announces only fresh
drafts once). Config: `prds` section (thresholds, debounce, writer tokens)
+ `auxiliary.prd_drafter`; triage rides the goal_judge transport (same
short-JSON shape). Privacy: no intake content in logs, enforced by construction.

Frontend � new `minerva-prds` plugin (auto-discovered): review section,
watching section, history, inline reject-reason + revise forms, paste-intake
form, dispatch button; `src/api/prds.ts`; `common.prds` in core catalog
(en + 6). File upload stays API-level (tested at REST); pane injects text.

Verified: Python 84/84 (pipeline incl. triage fixtures per outcome, drafting
citation rejects, review paths, dispatch idempotency x2, ingest seam, observe
gate, router E2E incl. file upload, registry suites unregressed); renderer
tsc 0; vitest minerva-prds + i18n 88/88; desktop-slash 24/24. Gateway/TUI
handler bodies compile-checked (no pytest in .venv � live suites are CI-only).
Follow-ups noted, not done: TUI turn-hook coverage (gateway only + manual),
pane file-picker, CLI turn-hook coverage.
---

# Session 21 � Phase 5 website form intake (2026-10-05)

The external funnel: agency-web form ? proxy ? portal upstream ? async drain
into the Phase-4 pipeline. Found the proxy + form already posting to a
nonexistent upstream � Phase 5 built the missing end, not a parallel one.

Portal (new `app/api/v1/intake/`): `_lib.ts` holds every decision
(validation matrix with per-field errors, site-key auth, per-key throttle,
store, queued list, ack) behind an injected store seam; three thin routes
(POST intake, GET queued, POST [id]/ack) only resolve the service client.
Keys REUSE `agency_api_keys` (purpose server, status/expiry enforced) � no
new key table, no mint UI; mint via existing POST /api/portal/keys. Throttle
5/hour/key + honeypot accept-and-discard mirror contact-sales. Migration 041
(`portal_intake_submissions`, RLS-locked, drain + throttle indexes) applied;
RLS gate green (41 migrations). Test runner: tsx + node:test per router
precedent (`test` scripts added to portal + agency-web package.json).

Agency-web: honeypot input (off-screen, unfocusable) + payload line; proxy
itself unchanged (forwards whole body � verified by test, plus a doc line on
the key requirement).

Python drain (new `hermes_cli/prd_forms.py`): queued ? ingest as
`website-form` (submission id = conversation = tracking id; contact in
thread context; media_url ? attachment ref) ? triage now ? ack done/failed,
per-submission isolation, silent skips (no key, lapsed premium, portal down).
Background job mirrors feeds_cron (own shim/script/schedule/reason); REST
status/enable/run on the prds router (literals registered before `/{prd_id}`
� FastAPI matches in order; that clash cost one debug round).
`MINERVA_INTAKE_API_KEY` registered in OPTIONAL_ENV_VARS (secret); base URL
is const + `MINERVA_INTAKE_BASE_URL` bridge.

Verified: portal tsc/eslint/build clean (routes registered), 10/10 upstream
tests (auth matrix incl. revoked/expired/publishable, validation, honeypot,
throttle + cross-key isolation, queue scoping/ordering, ack 404/400);
agency-web 4/4 proxy passthrough + eslint + build; Python 130/130 (all
premium suites incl. drain, e2e cited-source approval, forms-sync REST).
Deliberately deferred: portal console key-management page (API exists), pane
forms-sync toggle + file picker (REST exists).
---

# Session 22 � optional phone on form intake (2026-10-05)

Contact form gained an optional phone field, threaded through the whole
funnel: `ContactHero.tsx` input (`Phone (optional)`, `data-optional` so
the shared validator skips empties but checks format when filled) + payload
line; proxy forwards untouched (interface documents the field); portal
validates leniently (digits/spaces/+-.() only, empty omits) and stores it
(migration 042 applied); drain appends `tel <phone>` to the intake contact
line (no IntakeEvent schema change � rides thread_context like the email).

Verified: portal 11/11 + tsc/eslint clean; agency-web 5/5 + eslint clean;
Python forms 10/10.
---

# Session 23 � LEADS Phase 1 directory backend (2026-10-05)

New `hermes_cli/leads.py`: contacts DERIVED (sessions + pairing names +
website-form intake), never captured. Channel keys per plan (WhatsApp digit
JIDs with group-per-chat, Slack team+user, Discord/Telegram ids, form email);
bot and identity-less rows never become contacts; DM names track latest, group
names stick to chat title; snippets bounded with peer prefix; unread counts
inbound traffic after last_read (unknown reads zero); muted sinks in sort,
filtering stays read-time; overrides (mute/pin/note) in state_meta. Form
phones parse only the drain's own `tel` contact-line format. Three defects
caught by tests before merge (missing peer prefix, group naming, muted sort)
plus two test bugs.

Verified: 15/15 (pure derivation matrix + real-DB overrides round-trip and
empty-directory read). Plan doc advanced to Phase 1 done. Next: read REST +
reply endpoint (Phase 2/3).
---

# Session 24 � LEADS Phases 2+3 read REST + reply (2026-10-05)

`hermes_cli/web_routers/leads.py` mounted in web_server: GET /api/leads
(+ platform filter), GET /api/leads/{id} (contact + bounded recent messages
across DM channels), PATCH override (mute/pin/note, real meta writes), POST
/api/leads/reply. Reply resolves contact ? newest DM channel ?
`_resolve_platform_config` + `_authorize_relay_target` +
`_send_to_platform` (the sanctioned standalone path: chunking + senders
reused, target from OUR rows never the client); groups 400 read-only, form
leads 400 (reply by email), unknown platform 409, delivery failure 502 with
sanitized detail; success touches last_read_at. Literals registered with
param routes in safe order (no /{id} swallow � reply/list are method+shape
distinct, verified by route inspection).

Verified: 22/22 (15 derivation + 7 router: gate, filter, 404s, override
persist, newest-DM send + mark-read, validation matrix, relay/config/send
failure mapping); web_server imports clean. Pane (Phase 4) next.
---

# Session 25 � LEADS Phase 4 pane + cross-channel hints (2026-10-05)

`minerva-prds`-pattern `minerva-leads` plugin (auto-discovered): list with
search + channel chips + unread dots, muted section, master-detail with
bounded messages, two-step confirmed reply box (group/form read-only notes),
contact info with mute/pin/note editing; `src/api/leads.ts`;
`common.leads` in core catalog (en + 6); pane hardened with `?? []` reads
against older backends. Plus cross-channel `also_on` hints: backend matches
shared emails/phones (WhatsApp key digits populate phones, making WA?form
links real), REST + pane display, i18n � 4.

Verified: Python 24/24, tsc 0, vitest 87/87 (incl. i18n completeness).
Repairs along the way: three test-query bugs, one eaten test-def line, one
removal-instead-of-harden edit (all caught before green). Remaining plan
Phase 5: manual merge, intake deep links.
---

# Session 26 � LEADS Phase 5 merge + intake links (2026-10-05)

Manual merge (explicit, lossless, reversible): `merge_contacts`/
`unmerge_contact` validate (self/empty/target-merged rejected; cycles
structurally impossible), fold at read (channels/emails/phones union, newest
snippet, summed unread, widest span; sources vanish, targets gain
`merged_from`). REST PATCH takes `merged_into` (merge returns target,
unmerge restores source; merged-away ids 404 with the target named; re-link
idempotent). Form deep link: GET intake events per contact (bounded, capped).
Pane: merge picker (excludes self), unmerge rows, intake viewer for form
contacts; hardened `?? []` reads; 8 i18n keys � 4.

Verified: Python 30/30, tsc 0, vitest 90/90. LEADS plan closed (all 5
phases). Repairs: merged-away 404 vs unmerge action (restructured PATCH),
re-link idempotency expectation, two eaten test-def lines, one
removal-instead-of-harden, TS/backend contact_id shape alignment.
---

# Session 27 � portal device approve without agency (2026-10-06)

Auth debugging (localhost:3000/?code= loop) traced to Supabase project Site
URL still on localhost (fixed in dashboard, not code). Follow-up product fix
in `apps/portal/app/api/portal/device/approve/route.ts`: device connect no
longer 403s on missing agency membership. No membership rows at all ?
auto-provisions a personal agency (owner) and proceeds; suspended/invited rows
keep the refusal (no laundering); viewer-only keeps editor-required. Downstream
key/device writes use the resolved agency id. Runtime callers (transcription,
qqbot adapter) already degrade without pilk/keys, untouched. tsc/eslint clean.
Needs portal redeploy to take effect; verify via device-code sign-in E2E.
---

# Session 28 � portal signed-in UI state (2026-10-06)

Site now reflects auth state. New `app/components/account-button.tsx`
(variants sidebar/folded-signup/folded-login/nav/loginlink; session from
`/api/portal/session`; welcome shows email local-part as unclickable text;
sign-out reloads): sidebar signup button and both folded icons swap to
identity, Member Sign In hides when signed in, mobile nav swaps Sign in for
welcome + sign-out. Plans page grid extracted to client `plans-grid.tsx`:
signed-out renders exactly as before; signed-in locks the current tier to a
disabled `Current plan` card, routes others to /manage-subscription, and a
banner names the active package + credits. Pure rules in
`app/lib/account-display.ts`.

Verified: tsc 0; eslint clean on touched files (one pre-existing
no-html-link error in layout.tsx mobile nav left alone); 3/3 new tsx tests.
Needs portal redeploy to take effect.
---

# Session 29 � router Cloudflare Workers target (2026-10-07)

Vercel output investigation (green builds, total 404s incl. branch URLs)
closed in favor of porting: same Hono app, third target. New
`apps/router/src/worker.ts` (ALS-bridged per-request `ctx.waitUntil` so
concurrent streams never steal each other's debit lifetime; fail-open like
Node) + `wrangler.toml` (nodejs_compat for process.env/node:crypto) +
`deploy`/`dev:worker` scripts + README section. Shared-code changes kept
minimal and behavior-neutral: `after.ts` prefers the scoped hook with the
legacy global as fallback; `@minerva/database/health.ts` imports the TCP
`postgres` driver lazily (was barrel-pulled into every bundler graph;
caller is scripts-only). No app-logic, catalog, or tenant changes.

Verified: router tsc 0 (worker entry compiles under strict config), 54/54
suite green. NOT yet done (needs operator): wrangler login, 3 secrets,
deploy, workers.dev verify, custom-domain cutover of minrouter.abbble.co.za.
Vercel files left intact as fallback.
---

# Session 30 � router per-agency velocity limiting (2026-10-07)

Adopted the rate-limit half of the gateway proposal, rejected the rest.
Already existed (kept): agency client keys, tier-filtered catalog, credits +
monthly quota gates, Supabase ledger billing � no D1, no second billing store.
New `apps/router/src/velocity.ts`: sliding-window RPM per agencyId, free 20
/ paid 100 per minute via MINERVA_RPM_FREE/_PAID, checked AFTER billing gates
(denied requests never consume budget), 429 + retry-after on exceed,
fail-open store, in-memory per-isolate with documented DO graduation path.
Wired into chat + embeddings handlers. Key pool explicitly deferred: single
OPENROUTER_API_KEY until upstream 429s appear in logs; seam is apiKey() in
upstream.ts (round-robin + failure-skip when the day comes). Defaults leave
headroom under a single paid upstream key on purpose.

Verified: tsc 0, 62/62 (54 existing + 8 new). Upstream limits in the proposal
treated as shape-correct, numbers to re-check against OpenRouter docs at
implementation time of the pool.# Session 31 - upstream key pool: multi-key rotation + same-request failover (2026-10-07)

Fridays fire arrived early: upstream 429s in the logs, so the deferred pool from
Session 30 is now built. New apps/router/src/upstream-keys.ts: upstreamKeys() reads
OPENROUTER_API_KEYS (comma-separated, wins) else the singular OPENROUTER_API_KEY as a
one-key pool (fully backward compatible); UpstreamKeyPool round-robins with per-key
cooldowns from the committed table (429: 60s, 401/403: 10min likely-dead, 402: 5min,
502/503/504 + transport: 30s; unknown 4xx/5xx fail closed as terminal). Wired into
upstream.ts (chatOnce/chatStream) and embeddings.ts (embed): same-request failover
retries the IDENTICAL body on the next key, each key at most once; terminal statuses
return as-is on the first key; all-keys-limited returns the LAST upstream answer
(app.ts already maps 429 faithfully per the 2026-09-30 owner decision). Skipped
streaming bodies are drained before moving on; failover lines log key#index/total
only, never material. sharedKeyPool() singleton + reset() test seam. README deploy
table + Vercel/Workers secret lines document the plural.

Deliberately NOT changed: the failover table itself (kept the prior design; unknown
5xx fail closed rather than spraying one bad request across the pool), velocity
defaults, billing/ledger, catalog. No MINERVA_ var added (upstream creds stay
OPENROUTER_*).

Verified: router tsc --noEmit 0, 75/75 tests (62 pre-existing + 13 new in
tests/upstream-keys.test.ts: env parsing x4, classification x2, pool mechanics x3,
chatOnce failover/sad/terminal x3, chatStream failover x1). Operator still to do: set
OPENROUTER_API_KEYS (Wrangler secret or host env) alongside the singular; no code
deploy needed beyond this change.
# Session 32 - welcome-api Cloudflare Workers target (2026-10-07)

Vercel total-404s hit welcome-api too, so it got the same third-target port as
the router (Session 29) � simpler this time: no ledger drain, so src/worker.ts
is a one-line re-export of the Hono app (no ALS/waitUntil bridge), plus
wrangler.toml (name minerva-welcome, nodejs_compat, workers_dev=true),
deploy/dev:worker scripts, README section. Untouched: src/app.ts, policy.ts,
index.ts (Node/Docker), api/[[...route]].ts (Vercel fallback). Port is safe
because every dependency was already Workers-clean: lazy process.env reads,
global fetch, node:crypto (compat polyfill, same as router embeddings),
fetch-based supabase-js. No MINERVA_ROUTER_URL secret needed � the default is
already the live router workers.dev URL. One known shape limit, shared with
the router: the 300s relay AbortSignal exceeds Workers request wall-clock on
very long generations; consistent posture, not redesigned.

Verified: tsc --noEmit 0, smoke.mjs 13/13 live-server checks green,
wrangler deploy --dry-run bundles clean (811 KiB, no bindings). NOT yet done
(needs operator): 2 secrets (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY),
deploy, workers.dev verify, Custom Domain welcome-api.abbble.co.za (the
Python DEFAULT_NOUS_WELCOME_URL target).

---

# Session 30 — ABBBLE Portal sign-in runtime resolution (2026-10-07)

Desktop `pnpm dev` sign-in to ABBBLE Portal reported "Connected, but Minerva
still cannot resolve a usable provider. Minerva is not logged into ABBBLE
Portal. setup.status reports configured credentials, but runtime resolution
still failed." Root cause was a vehicle/model id split: the device flow
(`abbble` + legacy `nous` OAuth rows) persists `MINERVA_ROUTER_KEY` for the
`minerva` model provider, but explicit runtime resolution for `abbble` (and
`minerva` itself) aliased to `nous` via the Nous profile's aliases, so the
strict `setup.runtime_check {provider}` checked Nous OAuth (missing) while
`setup.status` (router key present) passed. Additionally both OAuth ids
created `abbble` sessions, so `nous` polls failed provider mismatch.

- `plugins/model-providers/nous/__init__.py` — removed `abbble`, `minerva`
  from Nous aliases (now only `nous-portal`, `nousresearch`); `nous` keeps
  its legacy OAuth identity.
- `plugins/model-providers/minerva/__init__.py` — added `abbble` to Minerva
  aliases (`minerva-router`, `abbble`); `abbble` vehicle now resolves to the
  `minerva` provider that consumes the router key. Old → new: `abbble` was
  `nous`, `minerva` was `nous`; now both are `minerva`, `nous` stays `nous`.
- `hermes_cli/web_routers/oauth.py` — `_start_abbble_device_code` takes
  `provider_id` and creates the session with it; `_DEVICE_CODE_STARTERS`
  preserves the requested id for both `abbble` and `nous` so poll matching
  succeeds.
- `apps/desktop/src/store/onboarding.ts` (+ test) — new
  `resolveModelSlugsForOAuth` maps both `abbble` and `nous` vehicles to
  `minerva` for `fetchProviderDefaultModel` + `setup.runtime_check`; the
  confirm card persists `minerva` and the strict check verifies the router
  key instead of Nous OAuth.
- `apps/desktop/src/store/onboarding.test.ts` — `nous` sign-in mock now
  returns/expects `minerva` provider + `minerva` runtime_check.

Deliberately not changed: the duplicate `nous` OAuth catalog row stays (old
installs need its disconnect for stored Nous tokens; both rows now complete
via the router key); `resolve_provider("auto")` already preferred `minerva`
when the router key exists.

Verify:
- `.venv\Scripts\python.exe -c "from hermes_cli.auth import _plugin_aliases; ..."` → `abbble:minerva`, no `minerva:nous`.
- `.venv\Scripts\python.exe` with clean `HERMES_HOME` + router key → `resolve_provider(abbble/minerva/auto)=minerva`, `resolve_runtime_provider(requested=abbble/minerva)` ok with `env:MINERVA_ROUTER_KEY`.
- `pnpm --dir apps/desktop vitest run src/store/onboarding.test.ts` → 27 passed; `src/lib/runtime-readiness.test.ts` + `src/store/onboarding-owner.test.ts` → 14 passed.

---

# Session 31 — Nous→router fallback for strict checks (2026-10-07)

Follow-up to Session 30: with old frontend code (or old `model.provider: nous`
configs) the failure moved from `setup.runtime_check` to `POST /api/model/set`:
`ABBBLE Portal is not connected: no API key or login was found for it. Add one
with 'minerva auth add nous'` with detail `Minerva is not logged into ABBBLE
Portal.` The assignment requested `nous` (fallback `providers[0]` when the
vehicle id matched no model slug), whose OAuth is gone, while only the router
key exists.

- `hermes_cli/runtime_provider.py` — new `_nous_missing_falls_back_to_router`
  + `_minerva_router_runtime_for_nous`; `_ladder_rungs` serves the Minerva
  router for explicit `nous` requests on missing/revoked Nous states when the
  router key exists, then returns (no re-raise). Live Nous sessions still
  resolve via OAuth above; with no credentials at all the original
  `nous_auth_missing` still raises (no silent OpenRouter reroute).

Deliberately not changed: `nous` stays a separate provider (old tokens keep
working); the frontend `nous→minerva` map from Session 30 remains the primary
path for new sign-ins — this is the safety net for stale callers/configs.

Verify:
- Router key only → `resolve_runtime_provider(requested=nous)` returns
  `provider=minerva, source=env:MINERVA_ROUTER_KEY` (was `nous_auth_missing`).
- No credentials → `requested=nous` still raises `nous_auth_missing`.
- `pnpm --dir apps/desktop vitest run src/store/onboarding.test.ts` → 27 passed.

---

# Session 32 — Dynamic router catalog + openrouter-free default (2026-10-07)

Two directives from the ABBBLE owner after sign-in started working: (1) the
onboarding default must be `minerva/openrouter-free` — landing on Opus failed
with "Model 'minerva/anthropic-claude-opus-4.6' was not found in this provider's
model listing" on free keys; (2) no fixed models in the router — OpenRouter
rotates frequently, so the pinned 9-model catalog is a no-go.

Default fix (engine):
- `hermes_cli/web_routers/models.py` — `GET /api/model/recommended-default`
  for `minerva` returns `minerva/openrouter-free` when listed (present on
  every tier), else the generic pick. Old → new: free keys got Opus (absent
  from their listing → set failed); now they get the free meta-router.
- `hermes_cli/models.py::get_default_model_for_provider` — `minerva` returns
  `minerva/openrouter-free` unconditionally (non-interactive fallback used by
  gateway/CLI hot paths when no model was ever selected).

Dynamic catalog (router):
- NEW `minerva-monorepo/apps/router/src/live-models.ts` — fetches OpenRouter's
  public `/models`, maps to wire shape (`minerva/<flattened>`), per-1M prices,
  `free` = both legs zero; drops unpriced entries (unmeterable = unservable)
  and wire-ID dupes. Cache TTL `MINERVA_MODELS_TTL_SECONDS` (default 3600,
  min 60); stale cache serves immediately while a background refresh runs;
  total failure → `null` so callers serve pinned. Singleflight dedupes.
- `src/app.ts` — `GET /v1/models` serves live tier-filtered with pinned
  fallback; chat resolves live-first, pinned fallback, omitted model still
  defaults to pinned `DEFAULT_FREE_MODEL`; `upgrade_required` denials name
  the live free list when reachable. Billing untouched (`chatCostUsd` uses the
  resolving entry's prices), so rotations never rewrite ledger history.
- `src/catalog.ts` — header rewritten: pinned list is now documented as the
  offline fallback + stub source, not the live catalog.
- `README.md` — new `MINERVA_MODELS_TTL_SECONDS` row, catalog section
  (live-first design, billing note, engine default).
- `tests/live-models.test.ts` (new, 6 tests) — transform/prices/dedupe,
  tier filter, spellings, failure→null, empty→null, stale-serve + background
  refresh (Date.now mock).

Deliberately not changed: stub router stays pinned (deterministic tests);
portal `/api/portal/models` was already live-first (OpenRouter → router →
pinned); engine `FALLBACK_MODELS` stays (offline fallback only, not a
catalog); `recommended_nous_default_model` untouched (legacy nous path);
`DEFAULT_MODEL` (Opus) kept for the stub fallback only.

Verify:
- `pnpm --filter @minerva/router typecheck` → exit 0.
- `pnpm --filter @minerva/router test` → 81 pass / 0 fail (75 existing + 6 new).
- Engine: `get_default_model_for_provider('minerva')` →
  `minerva/openrouter-free`; `GET /api/model/recommended-default?provider=minerva`
  with mocked payload → `minerva/openrouter-free` when listed, first model
  otherwise.
- `pnpm --dir apps/desktop vitest run src/store/onboarding.test.ts` → 27 passed.

Operator note: deploy the router for `/v1/models` to go live-dynamic; until
then the engine still reads the pinned 9 (free keys see 4 + 2 fallback = 6 in
the picker). After deploy, free keys see all live zero-price models, paid keys
the full upstream list; onboarding lands on the free meta-router on every tier.

---

# Session 33 — Free-only fallback trio (2026-10-07)

Owner directive: drop the two Anthropic paid flagships from the Minerva
fallback, then add Nemotron free. Fallbacks are now free-only so every
fallback row validates on every tier:
`openrouter-free`, `google/gemma-4-31b-it:free` (verified live: price 0/0,
ctx 262144), `nvidia/nemotron-3-ultra-550b-a55b:free` (verified live:
price 0/0, ctx 1000000).

- `plugins/model-providers/minerva/__init__.py` — `FALLBACK_MODELS` is now
  the three free wire IDs (was Opus 4.6 + Sonnet 4.6).
- `minerva-monorepo/apps/router/src/catalog.ts` — pinned offline fallback
  gains the Gemma + Nemotron free entries (grounded specs above); paid
  entries stay for paid-tier offline continuity and stub determinism.
- `tests/providers/test_minerva_profile.py` — fallback tuple updated.

Deliberately not changed: portal fallback tables (display-only, already
live-first); stub + billing-tier tests (relational assertions, still green).

Verify:
- Live OpenRouter check confirms both `:free` IDs at price 0/0.
- `pnpm --filter @minerva/router typecheck` → exit 0; `test` → 81 pass / 0 fail.
- Engine `get_provider_profile('minerva').fallback_models` → the trio.

---

# Session 34 — ABBBLE billing overview for device-key sign-ins (2026-10-07)

Desktop Settings → Billing showed no signed-in user or plan for Portal users:
`billing.state` / `subscription.state` are NAS-backed and need Nous OAuth,
which the ABBBLE device flow never mints (only `MINERVA_ROUTER_KEY`), so both
builders reported logged-out. The plans grid was already live (portal tiers);
only the account section was dead.

- Router `GET /v1/credits` now also returns `agency: {id, slug, name}` — the
  router is the only component that maps a device key to its agency (`tenant.ts`
  selects `agencies.name`, `RouterTenant.agencyName`). Also reverted a stray
  pre-existing workdir edit on that handler (`currency: summary.currency` →
  `'USD'`, the HEAD value; `CreditSummary` has no currency field and typecheck
  was red because of it).
- NEW `agent/abbble_billing.py` — ABBBLE-backed builders returning the same
  `BillingState` / `SubscriptionState` shapes: agency + balance + plan from
  router `/v1/credits`, tier catalog from portal public `/api/portal/plans`
  (price-ordered, router plan marked current; unmatched legacy plan ids still
  name themselves; free plan resolves the Free row). Paid `remaining` is
  derived as monthly grant minus router `used` (documented display math).
  Fail-open: `None` without a router key; `logged_in=True` + `error` when the
  key exists but a fetch fails. `can_change_plan=False` so surfaces render
  portal links (purchases stay portal-side); role/card unknown → those rows
  degrade to their existing disabled/portal states.
- `agent/billing_view.py::build_billing_state`,
  `agent/subscription_view.py::build_subscription_state` — fall back to the
  ABBBLE builders only when the NAS result is logged-out AND a router key is
  present. Live Nous sessions keep winning; keyless homes stay logged-out.
- NEW `tests/agent/test_abbble_billing.py` (8 tests) — keyless → None, agency
  + balance, current-tier mark, free plan, unlisted-plan naming, unreachable
  router error state, fallback-only-when-keyed for both builders, Nous-wins.

Deliberately not changed: desktop billing UI (already renders a logged-in
normal state with a portal link when `can_change_plan` is False); stub router
credits (deterministic canned bytes); `recommended_nous_default_model` and
guest-transfer settlement (legacy Nous path).

Verify:
- Functional smoke (stubbed fetchers, temp `HERMES_HOME`): all ABBBLE builder
  checks pass, incl. Nous-auth-error + key → ABBBLE state.
- `pnpm --filter @minerva/router typecheck` → exit 0; `test` → 81 pass / 0 fail.
- Desktop `use-billing-state` + `api` vitest → 51 passed.
- Note: `scripts/run_tests.sh` pytest lane unavailable in this env (no pytest
  in `.venv`); `tests/agent/test_abbble_billing.py` is written for that lane
  (real imports, temp home, module-attr patches — no source-reading).

---

# Session 35 — Agency team seats: invites + members management (2026-10-07)

Agency owners had no self-serve way to add seats — no invite endpoint or UI
existed; only the schema was ready (`agency_memberships` roles/status/
`invite_email`, RLS member-read + editor-mutate). No DB migration needed.

- NEW `apps/portal/app/lib/members.ts` — pure rules (zero deps, unit-tested):
  roles owner/manager/operator/viewer, people-management is owner/manager-only,
  only owners grant/touch owner, nobody mutates their own row, pending invites
  activate on sign-in never by hand, claim/consume split on the user's own
  active agencies.
- NEW `app/lib/members-server.ts` — service-role ops + code-enforced authz:
  `requireAgencyMember` (portal session only; router-key bearers rejected —
  headcount is never managed on a bearer credential), `claimInvitesForUser`
  (best-effort, unique-safe), Mailtrap invite mail (saved-first, reports
  `emailed: false` instead of failing the invite), `countOtherActiveOwners`.
- NEW `app/api/portal/members/route.ts` — GET roster (active/invited/
  suspended, invite emails + best-effort member emails); POST invite
  (idempotent resend per email via the unique partial index, race-safe).
- NEW `app/api/portal/members/[id]/route.ts` — PATCH role or suspend/
  reactivate, DELETE remove/cancel; last-active-owner guard (409) on every
  deactivating path.
- Claim hooks: web `auth/callback` (post-exchange) and device approve
  (pre-lookup — closes the orphan hole where an invited user minted a fresh
  personal agency since invites carry no `user_id`). Both best-effort.
- NEW `app/team` page + sidebar/mobile nav — roster, role/status actions,
  invite form; read-only for operators/viewers with the reason stated.
- NEW `apps/portal/tests/members.test.ts` (8 tests) — validation, role
  ladder, self-mutation ban, owner-row protection, invite-activation rule,
  claim split.

Deliberately not changed: RLS (stays as defense-in-depth; routes enforce in
code so managers — absent from `is_agency_editor` — can manage people);
no seat caps per plan (none exist in billing); member emails resolve
best-effort (null when the auth lookup fails); solo owners cannot
self-remove (another owner must act).

Verify:
- `pnpm --filter @minerva/portal typecheck` → exit 0.
- `pnpm --filter @minerva/portal test` → 22 pass / 0 fail (14 existing + 8 new).
- Touched files eslint-clean (full `pnpm lint` still reports 3 pre-existing
  errors + 3 warnings in untouched files: topbar/download/layout +
  anonymous/_lib, oauth/token, session route — left alone).

Operator note: needs `MAILTRAP_*` sender config for invite delivery (else
invites save with `emailed: false` and the UI says to share the signup link);
no migration to apply (022/023 already carry the schema).

---

# Session 36 — Per-seat spend allowances (2026-10-07)

Seats draw from one agency pool with no per-member guardrails: the ledger had
no member attribution and no seat-pricing SKU exists anywhere (billing package,
Stripe flows), so allowances are owner-allocated monthly caps against the
agency balance — no new money movement, no Stripe changes. A true per-seat SKU
remains a billing-catalog follow-up.

- DB `043_member_spend_allowances.sql` (new, NOT yet applied) —
  `agency_memberships.monthly_spend_cap_usd` (nullable, ≥ 0; settable on
  invited rows, applies on claim); `agency_credits_ledger.user_id` (historical
  rows stay NULL, excluded from member sums, never backfilled) + partial
  month index; `agency_credits_apply` 7-arg overload writing attribution with
  the 6-arg form kept as a back-compat wrapper (old router keeps debiting
  through deploys). No RLS change (member-read already covers the column).
- Router — `tenant.ts` resolves `memberUserId` from `agency_api_keys.
  created_by` (null for legacy keys → pool behavior); NEW `member-quota.ts`
  answers `{used, limit} | null` (fail-open: unreadable state skips
  enforcement, spend-read failure understates rather than 402s); chat gates
  run the existing quota check with it and rewrite `quota_exceeded` to
  member copy ("allowance reached ($X of $Y)… ask your owner"); chat +
  embeddings debits carry `p_user_id` (`ledger.ts`).
- Portal — PATCH `members/:id` accepts exactly one of role/status/
  `monthly_spend_cap_usd` (same owner/manager/self/last-owner guards; allowance
  edits never deactivate); POST invite accepts an optional allowance;
  GET roster carries `monthlySpendCapUsd` + `monthSpendUsd` (single-query-per-
  member sums in `monthSpendByUser`); Team UI gains per-row cap editor with
  live "$spent of $cap" lines plus an invite-time cap field.
- `tests/members.test.ts` +2 tests (allowance validation/normalization, guard
  matrix incl. invite-row caps).

Deliberately not changed: embeddings stay ungated (negligible cost, same as
agency quota posture); desktop billing overview untouched (agency-level view
stands); $0 cap means seat paused (gates deny at used ≥ 0 — intentional);
solo-owner self-mutation ban covers allowances too (no self-lockout without
recourse).

Verify:
- `pnpm --filter @minerva/router typecheck` + `test` → clean, 81 pass / 0 fail.
- `pnpm --filter @minerva/portal typecheck` → clean; `test` → 24 pass / 0 fail.
- Touched files eslint-clean.
- NOT yet done (needs operator): apply 043, redeploy router + portal.

---

# Session 37 — Paystack subscription billing, only gateway (2026-10-07)

No live payment rails existed: every billing mutation was a stub pointing at
website flows that didn't exist. Paystack is now the single gateway (platform
defaults already said so; stripe/paypal stay disabled and untouched).

- NEW `apps/portal/app/lib/paystack.ts` — client + contract: plan codes
  (`PAYSTACK_PLAN_*`), amounts from `@minerva/billing` cross-checked against
  the dashboard plan (refuse on drift), customer ensure-by-email,
  plan-attached initialize (Paystack auto-creates the subscription),
  verify-transaction ground truth, server-side disable, HMAC-SHA512 webhook
  auth, pure event router + grant math + period math.
- NEW `app/api/billing/paystack/webhook` — HMAC gate, reference idempotency,
  verify-before-grant, amount==invoice check (invoice major units vs Paystack
  minor units); initial purchases resolve the tier from the verified amount
  (prices unique per tier, metadata never trusted); renewals resolve via
  customer code; `subscription.create` stores code+token; disable/not_renew
  marks canceled (period kept); `payment_failed` marks past_due. Transient
  failures 5xx (Paystack retries), definitive states 200.
- NEW `app/api/billing/paystack/checkout` (owner-only) — customer ensure,
  initialize, open invoice row; returns the hosted checkout URL.
- NEW `app/api/billing/paystack/subscription/cancel` (owner-only) — disables
  at Paystack first (failure leaves everything untouched), then marks
  canceled. Plus GET `.../subscription` status for the manage page.
- Canceled-in-period keeps access: router `tenant.ts` + portal
  `agency-billing.ts` treat canceled-with-future-period as the paid plan
  (state stays collection-honest). Portal side also newly counts past_due
  toward plan, matching the router.
- UI — `/manage-subscription` is now a real checkout hub (subscribe/cancel
  per preselected tier, no-proration + period-end copy stated); plans-grid
  CTAs carry `?plan=` preselect; NEW `/paystack/callback` landing (webhook
  activates, page says so).
- DB `044_paystack_billing.sql` (new, NOT yet applied) — unique partial index
  on `invoices.gateway_reference` (replay idempotency), `subscriptions.
  gateway_subscription_token` (server-side disable).
- `tests/paystack.test.ts` (8 tests) — tier parsing, amount→tier, grant caps,
  period math, HMAC vectors, fail-closed secret, event routing, price-drift
  refusal. `tests/account.test.ts` CTA hrefs updated for `?plan=` preselect.
- `.env.example` — `PAYSTACK_SECRET_KEY` + plan codes. Currency follows the
  billing package (ZAR since Session 38); amounts updated accordingly.

Deliberately not changed: engine NAS billing paths (still endpoint-
unavailable by design); no proration (new purchase = fresh cycle, stated in
UI); no top-ups (same rails would serve them — follow-up with its own UI);
Stripe/PayPal schema + types untouched (legacy rows keep working); member
allowances compose (router balance gate still applies under the seat cap).

Verify:
- `pnpm --filter @minerva/portal typecheck` → clean; `test` → 32 pass / 0 fail
  (33 with the Session 39 spec test).
- `pnpm --filter @minerva/router typecheck` → clean; `test` → 81 pass / 0 fail.
- Touched files eslint-clean.
- NOT yet done (needs operator): create the plans with the Session 39
  script, set `PAYSTACK_*` env, register the webhook URL, apply 044,
  redeploy portal + router.

---

# Session 38 — ZAR billing: tiers, Paystack, displays (2026-10-07)

Paystack runs ZAR and the project bills in ZAR, but portal tiers were still
USD figures ($20/$100/$200) — taking them at face value would grant ~16x the
intended inference. All tier money is now ZAR end to end; credits stay USD
(inference costs USD), converted at `zarPerUsd` (16.39, env-overridable).

- `packages/billing` — portal tiers re-denominated: PLUS R350 / SUPER R1,650 /
  ULTRA R3,500 (converted at 16.39 and rounded up, the R3,500-agency
  precedent), `currency: planCurrency()`, `creditsForPlan` converts every
  branch (portal R350 → ~$23.49, R1,650 → ~$110.74, R3,500 → ~$234.90;
  legacy unchanged). Amounts are denominated in `planCurrency()` by contract.
- Portal Paystack lib — charge currency follows the package (`billingCurrency()`,
  now ZAR); dashboard-plan cross-check and webhook comparisons track it, so a
  currency flip fails closed instead of mischarging.
- Displays (tier PRICE only; credit balances stay $) — `PortalPlan.
  priceDisplay` (`R350`/`$20` by currency) used by homepage, plans grid, and
  manage page; subscription `dollars_per_month_display` emits the billing
  symbol (field name frozen as contract); plans `currency_note` → ZAR;
  desktop `money()` renders `R` for ZAR.
- DB `045_zar_tier_seeds.sql` (new, NOT yet applied) — registry seeds to ZAR
  figures (no live readers; keeps admin views truthful).
- Tests — router `billing-tiers` re-pinned (amounts, zar, converted grants);
  portal `paystack.test` amounts/currency re-pinned. Desktop/ui-tui/engine
  suites use static fixture strings (opaque-string contract) — untouched and
  green. `SUMMARY.md` tier table → ZAR.
- `BILLING_*_AMOUNT_CENTS` env keeps working: now denominated in the billing
  currency — set USD figures there only with `BILLING_CURRENCY=usd`.

Deliberately not changed: rollover caps (USD credit caps, not prices);
legacy agency tier; `formatMoney`/balances ($ credits); Stripe/PayPal schema.

Verify:
- Router typecheck clean; `test` → 81 pass / 0 fail.
- Portal typecheck clean; `test` → 32 pass / 0 fail.
- Desktop billing (state/api/index) → 73 passed. Touched files eslint-clean.
- NOT yet done (needs operator): recreate the three Paystack dashboard plans
  in ZAR (35000/165000/350000), apply 045, redeploy portal + router.

# Session 39 — Paystack ZAR plan provisioning script (2026-10-07)

Follow-up to the ZAR session: dashboard plan codes are operator-created, so
creation is scripted instead of click-ops. `apps/portal/scripts/create-
paystack-plans.ts` (`pnpm --filter @minerva/portal paystack:plans`) provisions
Minerva Plus/Super/Ultra as monthly ZAR plans from `@minerva/billing`
amounts — never hardcoded prices. Idempotent (exact name+amount+currency+
interval match reuses, never duplicates; paginated list); test keys run
freely, live keys refuse without `--live`; `--dry-run` previews. Prints the
`PAYSTACK_PLAN_*` env block. Run once per environment (codes differ).

- `tests/paystack.test.ts` +1 test — spec contract shared with checkout,
  four-field matcher (wrong interval rejected).
- Portal README documents the runbook (test → live, webhook URL, 044).

Verify: portal typecheck clean, `test` → 33 pass / 0 fail; script without a
key fails clean with guidance (exit 1); touched files eslint-clean.
Operator runs it with their own key — no credentials handled here.


