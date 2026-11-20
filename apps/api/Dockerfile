# syntax=docker/dockerfile:1
FROM oven/bun:1 AS base
WORKDIR /app

# Install deps (monorepo)
FROM base AS deps
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN bun install --frozen-lockfile

# Build API
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock ./
COPY apps/api ./apps/api
# Prisma generate needs schema + DATABASE_URL at generate time in some setups; use a dummy if unset
ARG DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=public"
ENV DATABASE_URL=$DATABASE_URL
WORKDIR /app/apps/api
RUN bunx prisma generate
RUN bun run build

# Runtime
FROM oven/bun:1 AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/package.json
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/prisma.config.ts ./apps/api/prisma.config.ts
COPY --from=build /app/apps/api/generated ./apps/api/generated
WORKDIR /app/apps/api
EXPOSE 4000
# Run migrations on startup (single-instance friendly), then start server
CMD ["sh", "-c", "bunx prisma migrate deploy && bun dist/src/main.js"]
