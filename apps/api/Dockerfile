# Build from the REPOSITORY ROOT:  docker build -f apps/api/Dockerfile -t portfolio-api .
FROM node:22-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter "@portfolio/api..."
COPY packages/shared packages/shared
COPY apps/api apps/api
# `build` runs `prisma generate` and bundles the shared package into dist/
RUN pnpm --filter @portfolio/api build

FROM base AS run
ENV NODE_ENV=production
COPY --from=build /app /app
WORKDIR /app/apps/api
EXPOSE 4000
# Apply pending migrations, then start. Migrations are idempotent and safe to run on every boot.
# (Calls the binaries directly so startup needs no package-manager download.)
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/server.js"]
