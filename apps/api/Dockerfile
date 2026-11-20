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
RUN set -e;   export PATH="/app/node_modules/.bin:/app/apps/api/node_modules/.bin:$PATH";   if command -v prisma >/dev/null 2>&1; then prisma generate;   elif [ -f /app/node_modules/.bin/prisma ]; then /app/node_modules/.bin/prisma generate;   elif [ -f /app/apps/api/node_modules/.bin/prisma ]; then /app/apps/api/node_modules/.bin/prisma generate;   elif [ -f /app/node_modules/prisma/build/index.js ]; then bun /app/node_modules/prisma/build/index.js generate;   else bunx prisma@7.10.1 generate; fi
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
CMD ["sh", "-c", "set -e; export PATH=\"/app/node_modules/.bin:/app/apps/api/node_modules/.bin:$PATH\"; if command -v prisma >/dev/null 2>&1; then prisma migrate deploy; elif [ -f /app/node_modules/.bin/prisma ]; then /app/node_modules/.bin/prisma migrate deploy; elif [ -f /app/apps/api/node_modules/.bin/prisma ]; then /app/apps/api/node_modules/.bin/prisma migrate deploy; elif [ -f /app/node_modules/prisma/build/index.js ]; then bun /app/node_modules/prisma/build/index.js migrate deploy; else bunx prisma@7.10.1 migrate deploy; fi; exec bun dist/src/main.js"]
