# nibash — product & architecture plan

## 1. Product overview

**nibash** is a multi-building apartment rental listing platform. Core differentiator: **building-first data model** — shared building infrastructure/amenities and location are captured once and inherited by all units, reducing owner effort and improving listing consistency.

### Target users & goals

| Persona                                   | Primary goals                                                                | Key pains solved                                                            |
| ----------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Owner/Landlord (single or multi-building) | List inventory fast, keep availability accurate, receive qualified leads     | Repeated data entry, managing many similar flats, stale listings            |
| Renter/Tenant                             | Find suitable flat by location/budget/specs/amenities, trust listing quality | Missing/unclear info (lift/parking/veranda/cost), poor photos, slow contact |
| Admin/Moderator                           | Keep marketplace safe and high-quality                                       | Fake/spam listings, abuse, inconsistent data                                |

### Product principles

- **Hierarchy first:** Building → Floors/Units; never duplicate building facts per unit.
- **Low-friction listing:** 2-stage wizard, room steppers, room-tagged uploads, **Save & Clone** for stacked layouts.
- **Trust & clarity:** dual galleries (unit vs building), structured spec grid, transparent cost breakdown, moderation.
- **Search precision:** filters that match real renter needs (verandas, floor, lift, parking, generator, rent range, beds/baths/size).

## 2. System architecture

### High-level components

| Component                                           | Responsibility                                                                                                        |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `apps/web` (Next.js 16, App Router)                 | Public SSR/SEO pages, search & listing detail, auth, owner/renter/admin portals, wizards, galleries/maps UI.          |
| `apps/api` (NestJS 11)                              | REST API, auth/RBAC, domain logic, validation, media signing, search queries, inquiries, admin actions, OpenAPI docs. |
| PostgreSQL + Prisma 7                               | Canonical relational store: users, buildings, apartments, images, inquiries, favorites, auth/session/OTP.             |
| S3-compatible object storage + CDN/image transforms | Store originals (presigned upload), serve optimized variants (WebP/AVIF, resized) via CDN/image service.              |
| Map tiles/geocoding (Leaflet + provider)            | Building pin capture/display, area context, optional map search view.                                                 |
| Notifications (Phase 3)                             | Email and SMS/WhatsApp adapters for inquiries/visits/status updates.                                                  |

### Runtime/data flow (simplified)

1. **Owner lists:** web wizard → API validates ownership/constraints → persists building/apartment rows → presigned upload → client uploads to storage → API records image metadata (key/url/tag/order/cover).
2. **Renter discovers:** web search page → API `GET /search` with filters/pagination → Postgres indexed query (approved + listable only) → SSR/streamed results.
3. **Lead:** renter submits inquiry/visit → API stores inquiry, rate-limits/anti-spam → owner inbox; notifications dispatched (P3).
4. **Moderation:** owner submits/publishes → moderation status gates public visibility → admin approves/rejects/suspends/features.

### Deployment topology (target)

- **Web:** Vercel/Render/Node host (SSR). Env: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SITE_URL`.
- **API:** Docker/Node service (Render/Fly/etc.) behind HTTPS. Env: `DATABASE_URL`, `JWT_SECRET`, storage creds, `WEB_ORIGIN`.
- **DB:** managed Postgres (Neon/Render/RDS/etc.). Migrations via `prisma migrate deploy`.
- **Storage:** R2/S3/MinIO; CDN in front for public reads.
- **Local dev:** `docker-compose` (Postgres, MinIO), Bun workspaces, `mise`.

## 3. Bounded domains & modules (API)

| Module               | Responsibility                                                                           | Key entities                         |
| -------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------ |
| `auth`               | Register/login, phone/email OTP, JWT access+refresh, session revocation, password reset  | `User`, `OtpCode`, `RefreshToken`    |
| `users`              | Profiles, roles, verification/contact preferences                                        | `User`                               |
| `buildings`          | Owner building CRUD, geo/amenities, submit for review, public approved read              | `Building`, `BuildingImage`          |
| `apartments`         | Unit CRUD, floor/label uniqueness, **clone**, availability/publish, public read          | `Apartment`, `ApartmentImage`        |
| `media`              | Presign, attach metadata, room tags, reorder, cover, delete (DB+object)                  | image tables                         |
| `search`             | Public listing search/filter/sort/pagination/map-bounds facets                           | read model over buildings+apartments |
| `inquiries`          | Create/manage inquiries & visit requests, owner inbox, status transitions                | `Inquiry`                            |
| `favorites` (P3)     | Save/unsave/list bookmarks                                                               | `Favorite`                           |
| `notifications` (P3) | Email/SMS/WhatsApp dispatch & templates                                                  | —                                    |
| `admin`              | Moderation queue, approve/reject/suspend, feature/unfeature, user/listing actions        | moderation fields                    |
| `common`             | Guards (auth/roles/ownership), decorators, DTO pagination, filters/interceptors, logging | —                                    |
| `database`           | `PrismaService`, transactions, health                                                    | —                                    |

## 4. Authorization & visibility rules

- **Roles:** `RENTER`, `OWNER`, `ADMIN` (a user may hold owner capabilities; keep role model extensible).
- **Ownership:** mutating building/apartment/media/inquiry-owner actions require `resource.ownerId == currentUser.id` (or ADMIN).
- **Public visibility:** only listings where building `moderationStatus == APPROVED` and apartment is publicly listable (`availabilityStatus` in allowed set per policy, typically `AVAILABLE`/`COMING_SOON`) appear in search/detail.
- **Contact exposure:** phone/WhatsApp reveal policy configurable (always visible, login-gated, or masked) to balance conversion vs spam.
- **Rate limiting:** auth, OTP, inquiry/create, and search endpoints protected against abuse.

## 5. Media strategy

- **Upload flow:** client requests presign → direct PUT to storage → client confirms/attaches metadata (entity, tag, order, cover) → API persists record. Avoid proxying large binaries through API.
- **Tagging:** building images captioned/typed (front/gate/parking/lobby/rooftop); apartment images require `roomTag`.
- **Delivery:** originals private or public-read by policy; serve via CDN with on-the-fly or pre-generated variants (WebP/AVIF, responsive widths), EXIF stripped, size/count limits enforced.
- **Lifecycle:** delete removes DB row and schedules/object-deletes storage key; reorder/cover updates are cheap metadata writes.

## 6. Search strategy

- **MVP (Postgres-first):** composable indexed filters — `areaZone`, `rentAmount` range, `bedrooms/bathrooms/verandas >=`, `sizeSqft >=`, `floorNumber` include/exclude, building booleans (elevator/parking/generator/security/rooftop), `availabilityStatus`, keyword/area text match (`ILIKE`/`tsvector` as needed). Stable sort + cursor/offset pagination.
- **Map/bounds:** filter by `lat/lng` bounding box; index/geo strategy upgraded (PostGIS) if needed.
- **Scale path:** introduce external search index (Meilisearch/Typesense) when query latency, relevance, or facet complexity demands it (P4 trigger).

## 7. Key invariants & business rules

- `(buildingId, floorNumber, unitLabel)` unique.
- `1 <= floorNumber <= building.totalFloors`.
- Apartment cannot be public if parent building not approved/public-eligible.
- **Clone** copies: facing, size, room counts, utilities, tenant prefs, rent/service/deposit, gas/billing; **resets**: id, unitLabel, floor target (suggested), images, publish/availability timestamps, inquiry/history; runs in a transaction with uniqueness checks.
- Status changes are explicit and auditable (timestamps/actor fields can be added in P2+).

## 8. Non-functional requirements

- **SEO:** SSR listing/search shells, metadata, sitemap, canonical URLs, structured data where applicable.
- **Performance:** image optimization/CDN, paginated search, DB indexes aligned to filters, avoid N+1 on listing cards.
- **Reliability:** transactional writes for multi-row operations (clone, media attach sets), idempotent-safe handlers where practical.
- **Security:** hashed passwords/OTPs, JWT rotation, input validation, RBAC/ownership checks, upload constraints, PII/contact handling per policy.
- **Observability:** structured logs, request/latency/error metrics, moderation/audit trail for admin actions.

## 9. Repository conventions (aligned with existing products)

- Bun workspaces, `apps/*` scoped packages (`@nibash/web`, `@nibash/api`).
- Root: `docker-compose.yml`, `mise.toml`, `render.yaml` (or per-target manifests), `.env.example`, `AGENTS.md`, `README.md`, `specs/`, `plans/`, `infrastructure/`, `scripts/`.
- Web: App Router route groups, domain components, `lib/api`, Zod schemas, Tailwind 4.
- API: Nest modular domains, DTO validation, Prisma schema/migrations/seed, Swagger.
- Quality: oxlint/oxfmt, typed boundaries, tests for critical flows (auth, CRUD/ownership, clone, search filters).
