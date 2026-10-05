# Minerva marketing site (agency-web) — static pages + lead intake.
#
# BUILD CONTEXT IS THE MONOREPO ROOT, not this directory:
#   docker build -f apps/agency-web/Dockerfile -t minerva-marketing .
# Same reason as the web app: workspace packages resolve outside this folder.
#
# NOT YET BUILT — Docker is unavailable on the development machine. Verify on a Docker-capable
# host before deploying.
#
# This app is public-facing and must hold NO service-role key. It posts lead forms to the web
# app's intake endpoint; it never writes to Supabase directly.

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@11 --no-audit --no-fund
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/billing/package.json packages/billing/
COPY packages/database/package.json packages/database/
COPY apps/agency-web/package.json apps/agency-web/
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM deps AS build
COPY packages/ packages/
COPY apps/agency-web/ apps/agency-web/
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter agency-web build

FROM base AS runtime
ENV NODE_ENV=production \
    PORT=3001 \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=build /repo ./
WORKDIR /repo/apps/agency-web
EXPOSE 3001
CMD ["pnpm", "exec", "next", "start", "--port", "3001"]
