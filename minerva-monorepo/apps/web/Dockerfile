# Minerva landing (Next.js static study page).
#
# BUILD CONTEXT IS THE MONOREPO ROOT, not this directory:
#   docker build -f apps/web/Dockerfile -t minerva-landing .
# The landing has NO workspace dependencies and NO server secrets; it only
# needs NEXT_PUBLIC_SITE_URL (metadata base URL, inlined at build time).

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@11 --no-audit --no-fund
WORKDIR /repo

# ---- deps -------------------------------------------------------------------
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --ignore-scripts

# ---- build ------------------------------------------------------------------
FROM deps AS build
COPY apps/web/ apps/web/
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @minerva/web build

# ---- runtime ----------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /repo/apps/web/public ./apps/web/public
WORKDIR /repo/apps/web
EXPOSE 3000
CMD ["node", "server.js"]
