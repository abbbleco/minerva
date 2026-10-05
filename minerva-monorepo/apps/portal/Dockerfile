# Portal (ABBBLE-style) — context MUST be the monorepo root (workspace:* deps).
#   docker build -f apps/portal/Dockerfile -t minerva-portal .
FROM node:22-alpine AS build
RUN corepack enable && corepack prepare pnpm@11.18.0 --activate
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/portal/package.json apps/portal/
COPY packages/billing/package.json packages/billing/
COPY packages/database/package.json packages/database/
RUN pnpm install --frozen-lockfile --filter @minerva/portal...
COPY . .
RUN pnpm --filter @minerva/portal build

FROM node:22-alpine AS run
WORKDIR /app/apps/portal
ENV NODE_ENV=production PORT=3002
COPY --from=build /app/apps/portal/.next ./.next
COPY --from=build /app/apps/portal/public ./public
COPY --from=build /app/apps/portal/package.json ./
COPY --from=build /app/node_modules /app/node_modules
EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:3002/api/health || exit 1
CMD ["npx", "next", "start", "--port", "3002"]
