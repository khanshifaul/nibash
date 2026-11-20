# nibash — roadmap

## Phase overview
| Phase | Duration | Theme | Outcome |
|---|---|---|---|
| **P1 — MVP** | Weeks 1–4 | Core data & listings | End-to-end list → discover → inquire works |
| **P2 — UX & media** | Weeks 5–6 | Speed & rich filtering | Fast, polished, multi-unit-friendly experience |
| **P3 — Trust & engagement** | Weeks 7–8 | Leads & verification | Trusted marketplace with complete lead workflow |
| **P4 — Growth** | Post-launch | Scale & monetization | Revenue, analytics, and scale levers |

## P1 — MVP (Weeks 1–4)
**Goal:** a landlord can publish a building+flat and a renter can find and inquire.

| Workstream | Deliverables | Acceptance criteria |
|---|---|---|
| Foundation | Monorepo scaffold, env/config validation, docker-compose (Postgres/MinIO), CI lint/build | `bun install && bun run dev` boots web+api locally with DB |
| Auth & roles | Register/login, OTP verify (email/phone path decided), JWT refresh, RBAC guards, `/me` | Owner/renter can sign in; protected routes enforced |
| Data model | Prisma schema v1, migrations, seed (demo owner/building/units) | Constraints/indexes applied; seed creates browsable data |
| Buildings | Owner create/edit/list/detail, amenities/geo, draft state | Owner adds building once with map/amenities |
| Apartments | Create/edit, floor/label uniqueness, availability toggle | Units belong to building; status flips without data loss |
| Media (basic) | Presign upload, attach building/apartment images, basic gallery render | Photos upload and display on detail |
| Public discovery | Search (area, rent range, beds/baths) + listing detail (specs, cost, galleries) | Renter finds and views eligible listings |
| Inquiries (basic) | Submit inquiry/visit request, owner list | Lead stored and visible to owner |
| Admin (basic) | Approve/reject pending buildings (minimal queue) | Only approved content public (if policy on) |

## P2 — UX & media (Weeks 5–6)
**Goal:** multi-unit owners list quickly; renters filter precisely and browse fast.

| Workstream | Deliverables | Acceptance criteria |
|---|---|---|
| Media pipeline | CDN/WebP/AVIF variants, responsive sizes, EXIF strip, upload limits/compression hints | Galleries load fast on mobile; correct ordering/cover |
| Room-tagged galleries | Mandatory apartment room tags, tabbed/filterable apartment vs building galleries | Renter can browse by room type |
| Clone flow | **Save & Clone** endpoint + UI (prefill, clear label/photos, suggest floor) | Owner creates stacked identical unit in minimal steps |
| Map | Building pin capture (refined), map on detail, map view on search (bounds) | Location accurate and explorable |
| Advanced filters | Verandas, floor/include-exclude ground, lift, parking, generator, security, size | Filters return correct results per index-backed queries |
| Wizard UX | Live preview, steppers polish, mobile sticky footer, draft autosave/recovery | Reduced drop-off; no accidental data loss |
| SEO/perf | Metadata, sitemap, structured data, image lazy-loading, query tuning | Listing pages indexable; acceptable LCP on search/detail |

## P3 — Trust & engagement (Weeks 7–8)
**Goal:** complete, trustworthy lead lifecycle.

| Workstream | Deliverables | Acceptance criteria |
|---|---|---|
| Visit workflow | Visit date/time request, owner status transitions, renter "my inquiries" | Both sides track pending→scheduled→closed |
| Notifications | Email notifications; SMS/WhatsApp provider hooks/adapters | Owner alerted on new lead; delivery observable |
| Favorites | Save/unsave/list for renters | Bookmarks persist and render |
| Moderation | Full queue, reject reasons, suspend/unsuspend, featured buildings, audit fields | Admin can enforce quality; actions traceable |
| Anti-abuse | Rate limits, captcha/guest policy, report listing, basic spam heuristics | Reduced spam inquiries/listings |
| Contact policy | Configurable reveal/mask for phone/WhatsApp | Matches conversion vs privacy decision |

## P4 — Growth & monetization (post-launch)
**Goal:** sustainable operations and scale.

| Workstream | Deliverables | Acceptance criteria |
|---|---|---|
| Promotion | Featured/boosted placements, ranking rules | Paid/promoted inventory surfaces correctly |
| Monetization | Owner tiers/subscriptions or pay-per-lead, billing integration hooks | Entitlements enforced; revenue events tracked |
| Analytics | Owner/admin dashboards (views, inquiries, conversion, occupancy trends) | Decisions driven by metrics |
| Search scale | External index (if triggered), relevance tuning, suggestions/autocomplete | p95 search latency and relevance targets met |
| Verification & trust | Stronger owner/listing verification, badges, dispute/report handling | Higher trust signals, lower abuse rate |
| Localization | bn/en content, BDT formatting, area taxonomy management | Usable for target market segments |

## Cross-phase backlog (ongoing)
- Security hardening, dependency updates, backup/restore drills.
- Test coverage for auth/ownership/clone/search correctness and critical UI flows.
- Accessibility and mobile UX refinements.
- Documentation: runbooks, API changelog, moderation policy.

## Milestones & checkpoints
| Checkpoint | Evidence |
|---|---|
| P1 demo | Seeded or newly created building+unit searchable and inquirable |
| P2 demo | Clone + tagged galleries + advanced filters + map usable on mobile |
| P3 demo | Approved listing receives inquiry → owner notified → visit scheduled/closed |
| Launch readiness | Moderation policy live, backups/monitoring, rate limits, ToS/privacy/contact rules defined |
