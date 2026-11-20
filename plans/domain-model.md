# nibash — domain model

Relational, building-first model (PostgreSQL + Prisma 7). Source of truth: `apps/api/prisma/schema.prisma`.

## 1. Entity relationship overview

```text
User (OWNER) 1 ──< Building 1 ──< Apartment 1 ──< ApartmentImage
                     │                 │
                     └──< BuildingImage  └──< Inquiry >── User (RENTER, optional)
                                           └──< Favorite >── User (RENTER)

User 1 ──< OtpCode (by contact, logical) / 1 ──< RefreshToken
```

- **Building** holds shared, inherited data (location + amenities + exterior media).
- **Apartment** holds unit-specific data (floor/label/rooms/pricing/availability + interior media).
- **Inquiry** connects a renter (or guest) to an apartment/owner for leads/visits.
- **Favorite** is a renter bookmark (Phase 3).

## 2. Enums

| Enum                                      | Values                                                                                               | Used for                                  |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `Role`                                    | `RENTER`, `OWNER`, `ADMIN`                                                                           | access control/persona                    |
| `ModerationStatus`                        | `DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `SUSPENDED`                                       | building/listing publication gate         |
| `AvailabilityStatus`                      | `AVAILABLE`, `RENTED`, `MAINTENANCE`, `COMING_SOON`                                                  | unit rental state                         |
| `GasType`                                 | `LINE`, `CYLINDER`, `LPG_CENTRAL`, `NONE`                                                            | unit utility                              |
| `ParkingType`                             | `NONE`, `BIKE`, `CAR`, `CAR_AND_BIKE`, `PAID`                                                        | building parking                          |
| `RoomTag`                                 | `COVER`, `MASTER_BEDROOM`, `BEDROOM`, `DINING`, `DRAWING`, `KITCHEN`, `WASHROOM`, `VERANDA`, `OTHER` | apartment photo tagging                   |
| `InquiryStatus`                           | `PENDING`, `CONTACTED`, `SCHEDULED`, `CLOSED`, `SPAM`                                                | lead workflow                             |
| `Facing` (recommended addition)           | `NORTH`,`SOUTH`,`EAST`,`WEST`,`NORTH_EAST`,`NORTH_WEST`,`SOUTH_EAST`,`SOUTH_WEST`                    | unit orientation                          |
| `TenantPreference` (recommended addition) | `FAMILY`,`BACHELOR_MALE`,`BACHELOR_FEMALE`,`ANY`                                                     | normalized prefs (currently string array) |

## 3. Models

### 3.1 `User`

| Field             | Type            | Notes                                 |
| ----------------- | --------------- | ------------------------------------- |
| `id`              | UUID (cuid)     | PK                                    |
| `name`            | string?         | display name                          |
| `email`           | string?         | unique, nullable (phone-first users)  |
| `phone`           | string?         | unique, nullable (email-first users)  |
| `passwordHash`    | string?         | null for OTP-only accounts if allowed |
| `avatarUrl`       | string?         |                                       |
| `role`            | `Role`          | default `RENTER`                      |
| `isVerifiedEmail` | bool            |                                       |
| `isVerifiedPhone` | bool            |                                       |
| timestamps        | created/updated |                                       |

**Indexes:** `email`, `phone`, `role`. **Relations:** owns buildings/apartments (logical), inquiries (as renter/owner), favorites, refresh tokens.

### 3.2 `Building` (shared/inherited)

| Field                                    | Type                                                                                                                                                                              | Notes                                              |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `id`, `ownerId`                          | UUID                                                                                                                                                                              | owner-scoped                                       |
| `name`, `slug`                           | string                                                                                                                                                                            | `slug` unique (public URLs)                        |
| `areaZone`, `roadBlock?`, `addressLine?` | string                                                                                                                                                                            | location text                                      |
| `lat`, `lng`                             | float                                                                                                                                                                             | exact pin (required for map)                       |
| `totalFloors`                            | int                                                                                                                                                                               | constrains apartment `floorNumber`                 |
| Amenities                                | `hasElevator`, `elevatorCount?`, `hasParking`, `parkingType`, `hasGenerator`, `generatorScope?`, `hasSecurityGuard`, `hasCctv`, `hasIntercom`, `hasRooftop`, `hasSubmersiblePump` | entered once, inherited by units                   |
| `moderationStatus`                       | enum                                                                                                                                                                              | `DRAFT/PENDING_REVIEW/APPROVED/REJECTED/SUSPENDED` |
| `isFeatured`                             | bool                                                                                                                                                                              | homepage/promo                                     |
| `publishedAt?`, timestamps               | datetime                                                                                                                                                                          |                                                    |

**Indexes:** `ownerId`, `moderationStatus`, `areaZone`, `slug`. (Add geo/bounds index or PostGIS in P2+ as needed.)

### 3.3 `BuildingImage`

| Field               | Type   | Notes                                                        |
| ------------------- | ------ | ------------------------------------------------------------ |
| `buildingId`        | FK     | cascade delete                                               |
| `storageKey`, `url` | string | object key + delivery URL                                    |
| `caption?`          | string | e.g. Front View, Parking, Lobby                              |
| `sortOrder`         | int    | gallery order                                                |
| `isCover`           | bool   | primary image (enforce single cover in app logic/constraint) |
| `width/height?`     | int    | optional metadata                                            |

**Indexes:** `buildingId`, `isCover`.

### 3.4 `Apartment` (unit-specific)

| Field                                                  | Type                                                                                                                     | Notes                                     |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| `buildingId`                                           | FK                                                                                                                       | inherits building context                 |
| `floorNumber`, `unitLabel`                             | int, string                                                                                                              | **unique together per building**          |
| `facing?`, `sizeSqft?`                                 | string/int                                                                                                               |                                           |
| Rooms                                                  | `bedrooms`, `attachedBathrooms`, `bathrooms`, `highCommodeCount?`, `diningRooms`, `drawingRooms`, `kitchens`, `verandas` | steppers; defaults 0 where sensible       |
| Utilities/prefs                                        | `gasType`, `utilityBillingType?`, `preferredTenantTypes[]`                                                               |                                           |
| Pricing                                                | `rentAmount`, `serviceCharge`, `securityDepositAmount`, `depositMonths?`                                                 | store money in minor units (paisa) as int |
| `availabilityStatus`, `availableFrom?`, `publishedAt?` | enum/datetime                                                                                                            |                                           |
| timestamps                                             | created/updated                                                                                                          |                                           |

**Constraints:** `@@unique([buildingId,floorNumber,unitLabel])`, `1 <= floorNumber <= building.totalFloors` (app/DB check). **Indexes:** `buildingId`, `availabilityStatus`, `rentAmount`, `(bedrooms,bathrooms,verandas)`.

### 3.5 `ApartmentImage`

| Field               | Type      | Notes                              |
| ------------------- | --------- | ---------------------------------- |
| `apartmentId`       | FK        | cascade delete                     |
| `storageKey`, `url` | string    |                                    |
| `roomTag`           | `RoomTag` | required for interior organization |
| `sortOrder`         | int       | per-unit gallery order             |
| `width/height?`     | int       |                                    |

**Index:** `apartmentId`.

### 3.6 `Inquiry`

| Field                                           | Type            | Notes                                         |
| ----------------------------------------------- | --------------- | --------------------------------------------- |
| `apartmentId`, `buildingId` (denorm), `ownerId` | FKs             | fast owner inbox/building scoping             |
| `renterId?`                                     | FK nullable     | null for guest inquiries                      |
| `guestName/phone/email?`                        | string          | guest contact (policy: allow or require auth) |
| `message?`, `requestedVisitAt?`                 | text/datetime   |                                               |
| `status`                                        | `InquiryStatus` | workflow state                                |
| timestamps                                      |                 |                                               |

**Indexes:** `apartmentId`, `buildingId`, `ownerId`, `status`.

### 3.7 `Favorite` (P3)

| Field                   | Type         | Notes           |
| ----------------------- | ------------ | --------------- |
| `userId`, `apartmentId` | composite PK | unique bookmark |
| `createdAt`             | datetime     |                 |

### 3.8 Auth/support tables

| Model          | Purpose                      | Key fields                                               |
| -------------- | ---------------------------- | -------------------------------------------------------- |
| `OtpCode`      | phone/email OTP verification | contact, `codeHash`, `purpose`, `expiresAt`, `usedAt`    |
| `RefreshToken` | session rotation/revocation  | `userId`, `tokenHash` (unique), `expiresAt`, `revokedAt` |

(Extend with `UserSession`/device/risk fields later if adopting shifaul-style session tracking.)

## 4. Derived/public read shape (listing card/detail)

A public listing view joins **Apartment + Building (+ images)** to present:

- Unit: floor/label, facing, size, room counts, gas/utilities, tenant prefs, rent/service/deposit, availability/availableFrom, tagged apartment gallery.
- Building: name, area/address, map pin, total floors, amenity badges, exterior gallery.
- Computed: total monthly (`rent + service`), move-in estimate (`rent + service + deposit`) for display.

## 5. Data integrity & lifecycle rules

- **Cascade:** deleting a building removes its apartments/images/inquiries (confirm UX); prefer archive/suspend over hard-delete in production.
- **Visibility:** public queries must filter `building.moderationStatus == APPROVED` and allowed `apartment.availabilityStatus`.
- **Uniqueness:** building `slug`; apartment `(buildingId,floorNumber,unitLabel)`; favorite `(userId,apartmentId)`; refresh token hash.
- **Money:** store integer minor units (paisa) to avoid float errors; format as BDT in UI.
- **Auditability (P2+):** consider `statusChangedAt`, `statusChangedBy`, moderation reason fields.

## 6. Suggested future extensions

- `Floor` table if per-floor metadata/media needed (currently `floorNumber` on apartment suffices).
- `Visit`/appointment entity separate from `Inquiry` if scheduling grows complex.
- PostGIS `geography(Point)` for radius/nearby search.
- Full-text/materialized search fields for name/address/area relevance.
- Owner verification/KYC profile, payout/subscription tables (P4 monetization).
