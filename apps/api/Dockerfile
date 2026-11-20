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
RUN set -e; \
  PRISMA_BIN=""; \
  for p in \
    /app/node_modules/.bin/prisma \
    /app/apps/api/node_modules/.bin/prisma \
    /app/node_modules/prisma/build/index.js \
    /app/apps/api/node_modules/prisma/build/index.js \
    ; do [ -e "$p" ] && PRISMA_BIN="$p" && break; done; \
  if [ -z "$PRISMA_BIN" ]; then PRISMA_BIN=$(find /app -path '*prisma/build/index.js' 2>/dev/null | head -1 || true); fi; \
  if [ -z "$PRISMA_BIN" ]; then echo "prisma binary not found"; find /app -name '*prisma*' | head -120; exit 1; fi; \
  echo "Using prisma: $PRISMA_BIN"; \
  case "$PRISMA_BIN" in *.js) bun "$PRISMA_BIN" generate ;; *) "$PRISMA_BIN" generate ;; esac
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
CMD ["sh", "-c", "set -e; PRISMA_BIN=\"\"; for p in /app/node_modules/.bin/prisma /app/apps/api/node_modules/.bin/prisma /app/node_modules/prisma/build/index.js /app/apps/api/node_modules/prisma/build/index.js; do [ -e \"$p\" ] && PRISMA_BIN=\"$p\" && break; done; if [ -z \"$PRISMA_BIN\" ]; then PRISMA_BIN=$(find /app -path '*prisma/build/index.js' 2>/dev/null | head -1 || true); fi; if [ -z \"$PRISMA_BIN\" ]; then echo prisma-not-found; exit 1; fi; case \"$PRISMA_BIN\" in *.js) bun \"$PRISMA_BIN\" migrate deploy ;; *) \"$PRISMA_BIN\" migrate deploy ;; esac; exec bun dist/src/main.js"]
