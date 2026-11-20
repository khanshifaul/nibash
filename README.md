# nibash

Multi-building apartment rental listing platform.

## Stack

- **Runtime/PM:** Bun workspaces
- **Web:** Next.js 16 (App Router), React 19, Tailwind CSS 4
- **API:** NestJS 11, TypeScript
- **DB:** PostgreSQL + Prisma 7
- **Auth:** Passport JWT + email/phone OTP
- **Storage:** S3-compatible (R2/S3/MinIO) with presigned uploads
- **Maps:** Leaflet + react-leaflet

## Apps

- `apps/web` — marketplace + owner/renter/admin portals
- `apps/api` — NestJS REST API with Prisma

## Getting started

```bash
# 1. Install deps
bun install

# 2. Copy env
cp .env.example .env

# 3. Start local infra
docker compose up -d

# 4. Run migrations
bun run db:migrate
bun run db:seed

# 5. Run dev servers
bun run dev
```

Apps:
- web: http://localhost:3004
- api: http://localhost:4000 (Swagger at /docs)

## Folder structure

```
apps/web    — Next.js App Router (public / auth / protected route groups)
apps/api    — NestJS domain modules + Prisma schema
specs/      — product specs
docs/plans/ — delivery plans
infrastructure/ — local Docker configs
scripts/    — dev/bootstrap helpers
```
