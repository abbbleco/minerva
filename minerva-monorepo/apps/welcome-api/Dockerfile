FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@11 --no-audit --no-fund
WORKDIR /repo

# ---- deps -------------------------------------------------------------------
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/welcome-api/package.json apps/welcome-api/
# NOT --prod: tsx is a devDependency and is the runtime.
# No workspace dependencies: this app talks to Supabase and the router over
# HTTPS and shares nothing else, so only its own manifest is needed.
RUN pnpm install --frozen-lockfile --ignore-scripts --filter @minerva/welcome-api...

# ---- runtime ----------------------------------------------------------------
# No build step: tsx runs the TypeScript sources directly.
FROM deps AS runtime
ENV NODE_ENV=production \
    PORT=8091
COPY apps/welcome-api/ apps/welcome-api/
# COPY runs as root, so the tree is root-owned. tsx writes its transpile cache
# under TMPDIR, and as `node` that fails with EACCES — hand ownership over
# before dropping privileges.
RUN chown -R node:node /repo
WORKDIR /repo/apps/welcome-api
USER node
CMD ["node", "node_modules/tsx/dist/cli.mjs", "src/index.ts"]
