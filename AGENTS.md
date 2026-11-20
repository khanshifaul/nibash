# nibash — agent guidance

## Stack

- Bun workspaces monorepo, `apps/*` scoped as `@nibash/*`
- `apps/web`: Next.js 16 App Router, React 19, Tailwind 4
- `apps/api`: NestJS 11, Prisma 7, PostgreSQL, Swagger
- Auth: Passport JWT + OTP; roles RENTER / OWNER / ADMIN

## Conventions (mirror `shifaul.dev` / `schoolos` / `zylosync`)

- Domain-first Nest modules (`controller/service/module/dto`)
- Web route groups: `(public)`, `(auth)`, `(protected)` with sub-areas `owner/renter/admin`
- Prisma schema at `apps/api/prisma/schema.prisma`, migrations in `apps/api/prisma/migrations`
- Env validation at API boot; `.env.example` per app
- `oxlint` + `oxfmt` for lint/format; `vitest` web / `jest` api

## Scripts

- `bun run dev` — start web + api in parallel
- `bun run dev:web` / `bun run dev:api`
- `bun run db:migrate` / `bun run db:seed`

## Paths

- Public listing: `/search`, `/listings/[id]`
- Owner portal: `/(protected)/owner/*` (dashboard, buildings/new, buildings/[id])
- Renter portal: `/(protected)/renter/*`
- Admin: `/(protected)/admin/*`
