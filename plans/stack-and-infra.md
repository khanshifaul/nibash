# nibash — stack and infrastructure

## 1. Technology stack (preferred)

| Layer | Technology | Version/notes |
|---|---|---|
| Runtime / package manager | **Bun** | workspaces, scripts, fast dev/install; `bun.lock` committed |
| Monorepo | **Bun workspaces** | `workspaces: ["apps/*"]`; packages `@nibash/web`, `@nibash/api` |
| Language | **TypeScript** (strict) | end-to-end typing |
| Web framework | **Next.js 16 (App Router)** | React 19, SSR/SEO, route groups, server/client components |
| Styling/UI | **Tailwind CSS 4** | `@tailwindcss/postcss`; component primitives in `components/ui` |
| Web validation/state | **Zod**, minimal client state | server-first; local state for wizards/maps/uploads |
| Maps | **Leaflet + react-leaflet** | OSM tiles default; provider/geocoding abstracted |
| API framework | **NestJS 11** | modular DI architecture, guards/pipes/interceptors |
| ORM | **Prisma 7** | schema, migrations, seed, generated client |
| Database | **PostgreSQL** | relational integrity, indexes, JSON/arrays where useful |
| Auth | **Passport + JWT (access/refresh)**, OTP | email/phone verification; RBAC roles |
| Storage | **S3-compatible** (`@aws-sdk/client-s3`) | R2/S3/MinIO; presigned direct uploads |
| Image delivery | **CDN + transforms** | WebP/AVIF, resize, EXIF strip (Cloudflare Images/imgproxy/Cloudinary) |
| API docs | **Swagger / OpenAPI** | `@nestjs/swagger` |
| Lint/format | **oxlint** (+ oxfmt optional) | aligned with schoolos/zylosync style |
| Testing | **Vitest** (web), **Jest/Supertest** (api) | critical flows covered first |
| Tooling | **mise.toml**, Docker Compose | reproducible local env |

## 2. Repository layout
```text
nibash/
  apps/web/            Next.js app (public, auth, owner, renter, admin)
  apps/api/            NestJS API + Prisma
  plans/               all planning docs
  specs/               product/feature specs (living)
  infrastructure/      docker/postgres/k8s helpers as needed
  scripts/             bootstrap/dev/seed/reset utilities
  .github/workflows/   CI (lint/test/build)
  docker-compose.yml   local Postgres + MinIO
  mise.toml, render.yaml, package.json, bun.lock, .env.example
```

## 3. Local development

### Prerequisites
- Bun (via `mise` or system install), Docker, Node-compatible tooling as needed.

### Setup
```bash
cp .env.example .env
bun install
docker compose up -d          # postgres + minio
bun run db:migrate
bun run db:seed               # optional demo data
bun run dev                   # web + api in parallel
```

### Default local ports/services
| Service | Port | Notes |
|---|---|---|
| Web | 3004 | Next.js dev |
| API | 4000 | Nest (`/api`, Swagger `/docs`) |
| Postgres | 5435 | `nibash/nibash_dev_password`, db `nibash` |
| MinIO (S3 API) | 9001 | console 9002; bucket `nibash-storage` |

(Adjust if conflicts; keep `.env.example` authoritative.)

### Environment variables (core)
**API:** `DATABASE_URL`, `JWT_SECRET` (+ refresh/OTP secrets as added), `WEB_ORIGIN`, storage (`STORAGE_ENDPOINT`, `STORAGE_REGION`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`, `STORAGE_FORCE_PATH_STYLE`), OTP/SMS provider keys (P3).
**Web:** `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SITE_URL`, map tiles/key if required.

## 4. Build, test, quality
| Concern | Command/approach |
|---|---|
| Lint | `bun run lint` (oxlint apps) |
| Test | `bun test` / per-app (`vitest`, `jest`, e2e) |
| Build | `bun run build` (web + api) |
| DB | `db:migrate`, `db:push` (dev only), `db:seed`, `db:studio` |
| CI | install → lint → typecheck/build → tests → (optional) migration check |

## 5. Deployment & environments

| Environment | Web | API | DB | Storage |
|---|---|---|---|---|
| Local | `next dev` | `nest start --watch` | compose Postgres | compose MinIO |
| Staging | preview deploy | container/service | managed Postgres (branch/db) | bucket/prefix |
| Production | SSR host + CDN | container/service + health checks | managed Postgres + backups | R2/S3 + CDN |

- **API health:** `/health` endpoint for probes.
- **Migrations:** run `prisma migrate deploy` during release (not at request time).
- **Secrets:** managed in platform secret store; never committed.
- **CORS/origins:** restrict to known web origins.

## 6. Media & maps integration notes
- **Uploads:** presigned PUT from client to bucket; store `storageKey`, public/CDN `url`, dimensions, tag/order metadata in DB.
- **Transforms:** prefer CDN/image-service URLs with width/format params; cache aggressively.
- **Maps:** Leaflet with OSM tiles needs no key; Mapbox/Google require keys/billing — keep `MapProvider` abstraction in web and geocoding behind API/service interface.

## 7. Security baseline
- Hash passwords (bcrypt/argon2) and OTP codes; short OTP TTL; attempt/rate limits.
- Rotate refresh tokens; revoke on logout/compromise.
- Strict DTO validation, ownership/RBAC guards, upload MIME/size limits.
- PII/contact visibility controlled by policy; audit admin actions.
- HTTPS everywhere; secure cookies/headers in production.

## 8. Observability & operations
- Structured application logs (request id, user/role context where safe).
- Error tracking (e.g. Sentry) and basic metrics (latency, error rate, queue/inquiry counts).
- DB backups and migration rollback plan.
- Admin audit log for moderation/feature/user actions (P2+).
