# nibash — API and routes plan

## 1. Conventions
- **Base:** REST JSON, versionable prefix (e.g. `/api/v1` or `/api`) with global prefix in Nest.
- **Auth:** Bearer JWT access token + refresh token (cookie or body per implementation choice); OTP endpoints for phone/email verification.
- **Validation:** DTOs with `class-validator`/`class-transformer`; whitelist/forbid non-whitelisted; consistent error shape.
- **Pagination:** `page/limit` or cursor; return `items`, `total`, paging metadata.
- **Docs:** Swagger/OpenAPI at `/docs` (dev/staging; policy in prod).
- **IDs:** UUIDs; public listing URLs may use slugs/ids.

## 2. Auth & users
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/register` | public | create account (email/phone, role intent per policy) |
| POST | `/auth/login` | public | credentials login → tokens |
| POST | `/auth/otp/request` | public | send OTP (login/signup/verify/reset) |
| POST | `/auth/otp/verify` | public | verify OTP → tokens or verification state |
| POST | `/auth/refresh` | refresh | rotate tokens |
| POST | `/auth/logout` | auth | revoke session/refresh token |
| POST | `/auth/forgot-password` | public | initiate reset |
| POST | `/auth/reset-password` | public | complete reset |
| GET | `/auth/me` | auth | current user/profile/session |
| GET/PATCH | `/users/me` | auth | profile read/update |
| (admin) | `/admin/users/*` | admin | list/manage/suspend users |

## 3. Buildings (owner + public/admin)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/buildings` | owner | create building (draft) |
| GET | `/buildings` | owner | list my buildings (filters: status) |
| GET | `/buildings/:id` | owner/admin | building detail (owner hub data) |
| PATCH | `/buildings/:id` | owner | update identity/location/amenities |
| DELETE | `/buildings/:id` | owner/admin | delete/archive (policy) |
| POST | `/buildings/:id/submit` | owner | submit for moderation / publish intent |
| GET | `/buildings/:id/public` | public | approved public building view (with eligible units summary) |

**Ownership/guards:** owner-only mutations scoped to `ownerId`; admin override for moderation.

## 4. Apartments/units
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/buildings/:buildingId/apartments` | owner | create unit (validates floor/label uniqueness) |
| GET | `/buildings/:buildingId/apartments` | owner/public* | list units (owner sees all; public sees approved+listable) |
| GET | `/apartments/:id` | owner/admin/public* | unit detail (public projection when eligible) |
| PATCH | `/apartments/:id` | owner | update specs/pricing/utilities/prefs |
| PATCH | `/apartments/:id/status` | owner | set availability/publish state |
| POST | `/apartments/:id/clone` | owner | clone to new floor/label (server-side copy/reset) |
| DELETE | `/apartments/:id` | owner/admin | delete/archive |

\*public projections never expose private/owner-only fields.

### Clone request/behavior (illustrative)
- Input: `{ targetFloorNumber?, targetUnitLabel?, copyAvailability?: false }`
- Copies: facing, size, room counts, gas/billing, tenant prefs, rent/service/deposit.
- Resets: images, unitLabel (required/provided), floor (suggested), published/available timestamps, inquiry history.
- Validates: building ownership, floor bounds, uniqueness; transactional.

## 5. Media (presign + metadata)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/media/presign` | owner | get presigned PUT (and read URL strategy) for building/apartment image |
| POST | `/buildings/:id/images` | owner | attach building image metadata (key,url,caption,sort,isCover) |
| PATCH | `/buildings/:id/images/reorder` | owner | reorder/set cover |
| DELETE | `/buildings/:id/images/:imageId` | owner | remove |
| POST | `/apartments/:id/images` | owner | attach apartment image (key,url,`roomTag`,sort) |
| PATCH | `/apartments/:id/images/reorder` | owner | reorder |
| DELETE | `/apartments/:id/images/:imageId` | owner | remove |

**Constraints:** file type/size/count limits, mandatory `roomTag` for apartment images, single cover for building.

## 6. Search & public listings
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/search/listings` | public | filter/sort/paginate apartments (joined with building) |
| GET | `/listings/:id` | public | public listing detail (apartment + building + galleries) |
| GET | `/search/suggestions` | public | area/keyword suggestions (optional P2) |

**Query params (MVP set):** `q/area`, `minRent`, `maxRent`, `bedrooms`, `bathrooms`, `verandas`, `minSqft`, `floor`, `excludeGround`, `hasElevator`, `hasParking`, `hasGenerator`, `availableOnly`, `sort` (`newest|rent_asc|rent_desc`), `page/limit` or `cursor`, `bounds` (P2 map).

## 7. Inquiries & favorites
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/inquiries` | public/auth (policy) | create inquiry/visit request (rate-limited) |
| GET | `/inquiries/owner` | owner | owner inbox (filters: status, building, apartment) |
| PATCH | `/inquiries/:id/status` | owner | update status (contacted/scheduled/closed/spam) |
| GET | `/inquiries/me` | renter | my inquiries/visits |
| GET | `/favorites` | renter | list saved (P3) |
| POST | `/favorites/:apartmentId` | renter | save (P3) |
| DELETE | `/favorites/:apartmentId` | renter | unsave (P3) |

## 8. Admin
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/admin/moderation/buildings` | admin | pending/review queue |
| PATCH | `/admin/buildings/:id/moderation` | admin | approve/reject/suspend (+ reason) |
| PATCH | `/admin/buildings/:id/feature` | admin | feature/unfeature |
| GET | `/admin/reports` | admin | abuse reports (P3) |
| PATCH | `/admin/users/:id/status` | admin | suspend/ban/unban |

## 9. Web route map (Next.js App Router)
| Route | Rendering | Notes |
|---|---|---|
| `/` | SSR/ISR | landing, featured areas/buildings |
| `/search` | SSR + client params | URL-synced filters, SEO-friendly first view |
| `/listings/[id]` | SSR/ISR | rich detail, metadata/structured data |
| `/buildings/[id]` | SSR | public building page (if exposed) |
| `/sign-in`, `/sign-up`, `/verify`, `/forgot-password`, `/reset-password` | client/SSR | auth flows |
| `/owner/dashboard` | protected SSR/client | metrics |
| `/owner/buildings`, `/owner/buildings/new`, `/owner/buildings/[id]` | protected | portfolio & hub |
| `/owner/buildings/[id]/apartments/new`, `/owner/apartments/[id]/edit` | protected | wizards |
| `/owner/inquiries` | protected | inbox |
| `/renter/saved`, `/renter/inquiries` | protected | P3 engagement |
| `/admin/*` | protected (admin) | moderation & ops |

## 10. API error & response conventions (recommended)
- Standard envelope or direct resource with consistent error: `{ statusCode, message, error, details? }`.
- 400 validation, 401 unauthenticated, 403 forbidden/ownership, 404 not found, 409 conflict (uniqueness/clone), 429 rate-limited.
- Never leak private owner/renter contact data in public endpoints.
