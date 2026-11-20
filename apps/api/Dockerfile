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
  PRISMA_PKG=$(find /app/node_modules/.bun -path '*prisma@7.10.1*/node_modules/prisma/package.json' 2>/dev/null | head -1 || true); \
  if [ -n "$PRISMA_PKG" ]; then PRISMA_DIR=$(dirname "$PRISMA_PKG"); mkdir -p /app/node_modules /app/apps/api/node_modules; ln -sfn "$PRISMA_DIR" /app/node_modules/prisma 2>/dev/null || true; ln -sfn "$PRISMA_DIR" /app/apps/api/node_modules/prisma 2>/dev/null || true; fi; \
  # also ensure @prisma/config resolvable if needed
  PRISMA_CONFIG_PKG=$(find /app/node_modules/.bun -path '*@prisma+config*7.10.1*/node_modules/@prisma/config/package.json' 2>/dev/null | head -1 || true); \
  if [ -n "$PRISMA_CONFIG_PKG" ]; then CFG_DIR=$(dirname "$PRISMA_CONFIG_PKG"); mkdir -p /app/node_modules/@prisma /app/apps/api/node_modules/@prisma; ln -sfn "$CFG_DIR" /app/node_modules/@prisma/config 2>/dev/null || true; ln -sfn "$CFG_DIR" /app/apps/api/node_modules/@prisma/config 2>/dev/null || true; fi; \
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
RUN set -e; \
  NEST_BIN=""; \
  for p in \
    /app/node_modules/.bin/nest \
    /app/apps/api/node_modules/.bin/nest \
    ; do [ -e "$p" ] && NEST_BIN="$p" && break; done; \
  if [ -z "$NEST_BIN" ]; then NEST_BIN=$(find /app -path '*@nestjs/cli*/bin/nest.js' 2>/dev/null | head -1 || true); fi; \
  if [ -n "$NEST_BIN" ]; then \
    case "$NEST_BIN" in *.js) bun "$NEST_BIN" build ;; *) "$NEST_BIN" build ;; esac; \
  else \
    echo "nest cli not found, trying bunx"; bunx --bun @nestjs/cli build; \
  fi

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
WORKDIR /app/apps/api
EXPOSE 4000
# Run migrations on startup (single-instance friendly), then start server
CMD ["sh", "-c", "set -e; PRISMA_PKG=$(find /app/node_modules/.bun -path '*prisma@7.10.1*/node_modules/prisma/package.json' 2>/dev/null | head -1 || true); if [ -n \"$PRISMA_PKG\" ]; then PRISMA_DIR=$(dirname \"$PRISMA_PKG\"); mkdir -p /app/node_modules /app/apps/api/node_modules; ln -sfn \"$PRISMA_DIR\" /app/node_modules/prisma 2>/dev/null || true; ln -sfn \"$PRISMA_DIR\" /app/apps/api/node_modules/prisma 2>/dev/null || true; fi; PRISMA_CONFIG_PKG=$(find /app/node_modules/.bun -path '*@prisma+config*7.10.1*/node_modules/@prisma/config/package.json' 2>/dev/null | head -1 || true); if [ -n \"$PRISMA_CONFIG_PKG\" ]; then CFG_DIR=$(dirname \"$PRISMA_CONFIG_PKG\"); mkdir -p /app/node_modules/@prisma /app/apps/api/node_modules/@prisma; ln -sfn \"$CFG_DIR\" /app/node_modules/@prisma/config 2>/dev/null || true; ln -sfn \"$CFG_DIR\" /app/apps/api/node_modules/@prisma/config 2>/dev/null || true; fi; PRISMA_BIN=\"\"; for p in /app/node_modules/.bin/prisma /app/apps/api/node_modules/.bin/prisma /app/node_modules/prisma/build/index.js /app/apps/api/node_modules/prisma/build/index.js; do [ -e \"$p\" ] && PRISMA_BIN=\"$p\" && break; done; if [ -z \"$PRISMA_BIN\" ]; then PRISMA_BIN=$(find /app -path '*prisma/build/index.js' 2>/dev/null | head -1 || true); fi; if [ -z \"$PRISMA_BIN\" ]; then echo prisma-not-found; exit 1; fi; case \"$PRISMA_BIN\" in *.js) bun \"$PRISMA_BIN\" migrate deploy ;; *) \"$PRISMA_BIN\" migrate deploy ;; esac; if [ -f dist/src/main.js ]; then exec bun dist/src/main.js; elif [ -f dist/main.js ]; then exec bun dist/main.js; else echo \"entrypoint not found\"; find dist -maxdepth 4 2>/dev/null || true; exit 1; fi"]
