# Minerva Router — the only image that holds upstream inference credentials.
#
# BUILD CONTEXT IS THE MONOREPO ROOT, not this directory:
#   docker build -f apps/router/Dockerfile -t minrouter .
#
# The router depends on `@minerva/billing` and `@minerva/database` via `workspace:*`, so a context
# scoped to this folder cannot resolve them. An earlier version of this file used npm against a
# self-contained context and failed with:
#   npm error code EUNSUPPORTEDPROTOCOL / Unsupported URL Type "workspace:": workspace:*
# The monorepo is not optional here.
#
# WHY THIS RUNS VIA tsx INSTEAD OF COMPILED JS
# --------------------------------------------
# The shared packages publish **TypeScript source** (`"main": "./index.ts"`) and define no build
# step, so they emit no JavaScript. A `tsc`-compiled router would still emit
# `import { ... } from '@minerva/billing'`, which Node resolves to a `.ts` file it cannot execute.
# Running the sources through tsx is therefore the correct choice, not a shortcut: it is exactly
# what `pnpm start` does in development, so the image behaves like the environment the router was
# actually tested in. Compiling to JS would require giving the shared packages a build step first.
#
# The tradeoff is a small startup transpile cost — worth it over an image that cannot boot.
#
# Runs on the loopback by default; publish only behind the reverse proxy with key auth (plan §3.1).
#
# RUNTIME ENV (set at deploy time, never baked in):
#   PORT=8090 (default)                      — Hono listen port.
#   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY  — tenant resolution + ledger. Same project as portal.
#   OPENROUTER_API_KEY                        — upstream inference. ONLY this image holds it.
#   MINERVA_ROUTER_STUB=0                     — live mode. `1` serves canned bytes, no DB/upstream.
#   MINERVA_CORS_ORIGINS                      — comma-separated browser origins, e.g.
#                                             `https://portal.abbble.co.za`. Defaults to the portal
#                                             plus localhost:3000/3001 for dev. Native clients
#                                             (Minerva desktop) ignore CORS; this only gates browsers.
#   BILLING_* / MINERVA_FREE_*                — must match the portal's values or grants ≠ gates.

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@11 --no-audit --no-fund
WORKDIR /repo

# ---- deps -------------------------------------------------------------------
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/billing/package.json packages/billing/
COPY packages/database/package.json packages/database/
COPY apps/router/package.json apps/router/
# NOT --prod: tsx is a devDependency and is the runtime (see the note above).
RUN pnpm install --frozen-lockfile --ignore-scripts

# ---- runtime ----------------------------------------------------------------
# No separate build stage: there is no compile step, and the whole workspace must travel together
# because the router resolves `@minerva/*` through pnpm's workspace links.
FROM deps AS runtime
ENV NODE_ENV=production \
    PORT=8090
COPY packages/ packages/
COPY apps/router/ apps/router/
# COPY runs as root, so the tree is root-owned. `pnpm exec` writes temp files into the working
# directory, and as `node` that fails with:
#   EACCES: permission denied, open '/repo/_tmp_1_...'
# Hand ownership over before dropping privileges. Chowning node_modules is slow but this is a
# one-time image build, and running as root instead would be a worse trade.
RUN chown -R node:node /repo
WORKDIR /repo/apps/router
USER node
EXPOSE 8090
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8090)+'/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
# Call tsx's entry point through node directly — NOT `pnpm exec tsx`.
#
# `pnpm exec` runs a dependency-status check first. In the image it decides node_modules looks
# stale (the copied store does not match what it expects at this path) and tries to re-install:
#   [ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY] Aborted removal of modules directory due to no TTY
# A runtime container must never re-install dependencies — that needs network, defeats the point
# of the image, and would silently change what is running. Invoking the CLI directly skips the
# check entirely. `node_modules/.bin/tsx` is a shell shim, so use the real entry point.
CMD ["node", "node_modules/tsx/dist/cli.mjs", "src/index.ts"]
