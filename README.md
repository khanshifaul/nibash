# nibash

Multi-building apartment rental listing platform.

## Stack

- **Runtime/PM:** Bun workspaces
- **Web:** Next.js 16 (App Router), React 19, Tailwind CSS 4
- **API:** NestJS 11, TypeScript, Swagger (`/docs`)
- **DB:** PostgreSQL + Prisma 7
- **Auth:** Passport JWT + email/phone OTP + Google OAuth (optional)
- **Storage:** S3-compatible (Cloudflare R2 / S3 / Backblaze B2 / MinIO) with presigned uploads
- **Maps:** Google Maps JavaScript API (location picker) + Maps Embed API (listing map)
- **Notifications:** Web Push / VAPID (owner inquiry alerts)

## Apps

- `apps/web` — marketplace + owner/renter/admin portals
- `apps/api` — NestJS REST API with Prisma

## Getting started

```bash
# 1. Install deps
bun install

# 2. Copy env
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

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

## Demo accounts (seed)

After `bun run db:seed`:

| Role  | Email                  | Password      |
| ----- | ---------------------- | ------------- |
| Owner | `owner@example.com`    | `password123` |
| Owner | `landlord@example.com` | `password123` |

## Key environment variables

### Web (`apps/web`)

- `NEXT_PUBLIC_API_BASE_URL` — API origin (e.g. `http://localhost:4000`)
- `NEXT_PUBLIC_SITE_URL` — web origin
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — Google Maps key (Maps JavaScript API + Maps Embed API). Restrict by HTTP referrers in GCP.

### API (`apps/api`)

- `DATABASE_URL` / `DIRECT_URL` — Postgres (pooled runtime + direct migrations for Neon)
- `JWT_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_DAYS`
- `WEB_ORIGIN`, `APP_URL`
- `STORAGE_*` — S3-compatible storage config; for B2 set CORS to allow web origin(s), methods `GET,PUT,HEAD`, headers `*` (or `content-type,x-amz-*`), expose `ETag`.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` — optional Google OAuth
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` — web push for owner inquiry notifications

## Deploy notes

- **Web (Vercel):** project root `apps/web`. Set `NEXT_PUBLIC_*` env vars and redeploy after changes (Next public envs are build-time).
- **API (Render):** run `prisma migrate deploy` on deploy/startup as needed. Set DB/auth/storage/OAuth/VAPID env vars.
- **Google OAuth:** add authorized redirect URI in Google Cloud Console: `<API_ORIGIN>/auth/google/callback`.
- **Google Maps:** enable Maps JavaScript API + Maps Embed API; restrict key by HTTP referrers.

## Folder structure

```
apps/web    — Next.js App Router (public / auth / protected route groups)
apps/api    — NestJS domain modules + Prisma schema
specs/      — product specs
docs/plans/ — delivery plans
infrastructure/ — local Docker configs
scripts/    — dev/bootstrap helpers
```
