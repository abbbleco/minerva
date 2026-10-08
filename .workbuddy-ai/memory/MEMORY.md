# MinervaV2 — project memory

## Build / verification conventions (MANDATORY)

- **The build command must only ever be run on GitHub, never locally.**
  Do not run `python scripts/bundles/desktop.py ...`, `scripts/run-electron-builder.mjs`,
  `scripts/build/*.mjs`, or any desktop bundle/release build on this machine.
  CI (GitHub Actions) is the source of truth for builds.
- Consequence: verify changes by static means only — code reading, `git diff`,
  grep, and pure syntax checks (`compile(open(f).read(), f, 'exec')`, which writes no
  bytecode). Do not spin up local builds to "prove" a fix.
- Local `node_modules` is **not** a faithful copy of `package-lock.json` (extra nested
  copies exist), so local typecheck/resolution results can diverge from CI. Prefer
  reading the lockfile over trusting a local run.
- No `pytest` is installed in `.venv` (and installing costs metered WiFi data), so the
  Python suite cannot be run locally — reason statically and let CI judge.

## Release artifact naming — single source of truth

- `apps/desktop/product-identity.cjs` is THE source for every name-shaped value.
  Verified real values (`MINERVA_DESKTOP_VARIANT=bundled`):
  - `artifactNamePascal` / `appNamePascal` = `MinervaBundled`
  - `appId` = `co.abbble.minerva-bundled`
  - `msixAppIdWithOrg` = `Abbble.MinervaBundled`
  - light variant: `MinervaLight`; canary suffix appends `Canary` (e.g. `Abbble.MinervaBundledCanary`)
- `apps/desktop/electron-builder.config.cjs` builds
  `artifactName = ${artifactNamePascal}-${version}-${os}-${arch}.${ext}`
  → real files are e.g. `MinervaBundled-0.33.0-win-x64.msix`.
- **Do NOT reintroduce `HermesBundled` / `HermesLight` as artifact-name literals.**
  Consumers must match `MinervaBundled` / `MinervaLight`.
- `NousResearchInc.HermesAgent` (store `identityName`) is deliberately retained until the
  ABBBLE Store account lands — do not "fix" it. `NousResearch.*` MSIX identity strings in
  older fixtures are separate from artifact filenames.

## Known incomplete-rebrand pattern (watch for it)

The fork rebranded `product-identity.cjs` but several consumers lagged, causing
failure-after-failure in the desktop release pipeline. Sites already fixed:
`desktop-bundle-smoke.yml` (`product=`), `desktop-bundled-release.yml` (msixbundle
glob/regex), `scripts/releases/darwin.py` (mac feed prefix), `scripts/render-builds-table.py`
(asset regex + section keys). Still stale (harmless/opaque fixtures, comments):
`apps/desktop/electron/{package-process-reap,updater/relaunch-waiter}.ts` comments,
`apps/desktop/scripts/*.test.mjs` stubs, and name-agnostic fixtures in
`tests/scripts/test_release_r2.py`, `test_stable_release.py`, `test_upload_summary.py`,
`test_release_channels.py`, `test_channel_build_versions.py`.
