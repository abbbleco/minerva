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

**Rule applied, in order:** `Nous Research` â†’ `ABBBLE CO`, then `Hermes` â†’
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
| `lib/provider-setup-errors.ts` | Its regex matches **backend-emitted** text (`No Hermes provider configured`). Renaming would silently stop detecting it. |
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
| `hermes_cli/default_soul.py`, `banner.py`, `cli_render.py`, `skills_hub.py`, `model_switch.py` | The **Python backend** still says *"You are Hermes Agent, built by Nous Research"*, so the agent introduces itself as Hermes in chat. Outside the frontend-UI scope, but user-visible. |
| `electron/main.ts` dialog copy (`'Hermes update'`, `'Sign in to Hermes gateway'`, crash dialog), `notification-ipc.ts:46` | Electron-side, outside the frontend-UI scope. |
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
minerva-assets app serves any key under eleases/ and, with
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

- Fork notice under the title: this tree is a Hermes Agent clone/fork
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
