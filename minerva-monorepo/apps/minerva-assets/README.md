# Minerva Assets

Read-only origin for the Minerva Desktop release-channel protocol, at
`https://minerva-assets.abbble.co.za`.

Minerva Desktop does not run a conventional updater. A Windows install is an
MSIX package whose update source is a `.appinstaller` descriptor that **Windows
itself** resolves and applies; a macOS install uses electron-updater against a
`{channel}-mac.yml` feed. Both are reached through a custom, signed *channel*
protocol, and this app is where that protocol is served.

## Endpoints

| Route | Purpose |
| --- | --- |
| `GET /releases/channels/<channel>.json` | The channel record: the one object every installed client reads to learn whether an update exists. Validated before it is served. |
| `GET\|HEAD /releases/<key>` | Build manifests, feed descriptors and artifacts. A `…/build.json` manifest is validated; artifacts stream through untouched. |
| `POST /api/publish` | Write side. Bearer-token authenticated. |
| `GET /health` | Liveness plus the resolved object source. |

## Why the origin validates

The desktop's resolver has **no fallback for a malformed body**. A channel
record that fails to decode takes the channel offline for every install at once,
with no "stay on your current build" path. So a record or manifest is checked
against the protocol grammar (`lib/protocol.ts`) at two points:

- **before it is stored** — a broken publish is a `422` to the publisher;
- **before it is served** — anything that reached the object root by another
  route is refused with `502` rather than handed to the fleet.

`lib/protocol.ts` is the server-side twin of
`apps/desktop/electron/updater/channel-protocol.ts` in the product repo, which
is the client-side decoder and the authority. Validation covers *shape* only.
Trust decisions — identity equality, version/sequence binding, signing identity,
immutable key prefixes — stay client-side, so passing validation never means
"safe to install".

## Writing

Publishing is a separate, credentialed step; this app is a plain public web
server with **no write credentials beyond one publish token**, and it refuses to
start without a token configured.

```
POST /api/publish?key=<object key>
Authorization: Bearer $MINERVA_ASSETS_PUBLISH_TOKEN
```

Rules, all enforced server-side:

- **Immutable published builds.** A key under `releases/channel-builds/<buildId>/`
  is never overwritten. Republishing identical bytes is a `200` no-op; different
  bytes are a `409`. A client that already resolved an artifact must never pull
  different bytes than the manifest it validated.
- **Channel records are the one mutable object** — they are a head pointer, and
  are replaced in place.
- **Atomic writes.** Temp file in the same directory → `fsync` → `rename`. A
  client that requests a key mid-publish sees the whole object or nothing.
- **Key grammar.** The key is validated against the protocol's own grammar, so
  traversal and Windows reserved device names cannot reach the filesystem.

`scripts/publish.mjs` wraps this for CI:

```bash
MINERVA_ASSETS_PUBLISH_TOKEN=… node scripts/publish.mjs \
  --key releases/channel-builds/<buildId>/build.json \
  --file build.json \
  --origin https://minerva-assets.abbble.co.za
```

It computes the digest locally as well and fails if the origin stored a
different one, so a truncated or proxied upload is caught in CI rather than by
the first client that resolves it.

## Configuration

| Variable | Meaning |
| --- | --- |
| `MINERVA_ASSETS_ROOT` | Directory holding the archive. **Required for publishing**; the write path refuses without it. |
| `MINERVA_ASSETS_BUCKET_URL` | Alternative read source: an already-public HTTPS bucket. Read-only — a bucket origin has no publish path. |
| `MINERVA_ASSETS_PUBLISH_TOKEN` | Bearer token for `POST /api/publish`. Unset means no publish path at all, never an open one. |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin, echoed into each published request's `publicBase`. |

Set exactly one of `MINERVA_ASSETS_ROOT` / `MINERVA_ASSETS_BUCKET_URL`; the app
refuses to boot with both or neither. See `.env.example`.

## Caching

The archive has exactly one mutable object, so the split is clean:

- `releases/channel-builds/**` and `releases/tag/**` — immutable, `max-age=31536000, immutable`
- `releases/channels/*.json` — `no-cache`, because a client must never resolve a
  stale head

## Verifying

```bash
npm run build
node scripts/smoke.mjs
```

`scripts/smoke.mjs` boots the real server against a temp object root and proves
the authorization, validation, immutability, atomicity and caching behaviour
end to end — 22 checks including a `bundleEnv` injection attempt, a traversal
key, an immutable-overwrite conflict and a byte-for-byte artifact round trip.
These rules are only meaningful against a running server; a unit test would not
catch a route that never registered or a Windows `fsync` rejection.
