# nibash — decisions and risks

## 1. Open decisions (lock early)

| #   | Decision                       | Options                                               | Recommendation / notes                                                                  | Impact                                          |
| --- | ------------------------------ | ----------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------- |
| D1  | **Identity model**             | Email-only, phone-only, both                          | **Both** (phone OTP prominent for local market) with verified flags                     | Auth UX, OTP cost, account recovery, uniqueness |
| D2  | **Guest inquiries**            | Require login vs allow guest + captcha/rate-limit     | Allow guest with strong rate-limit/captcha; promote to account later                    | Conversion vs spam volume                       |
| D3  | **Contact reveal policy**      | Always show phone/WhatsApp, login-gated, masked relay | Configurable; start login-gated or masked for public, reveal after intent               | Lead quality, privacy, abuse                    |
| D4  | **Moderation policy**          | Approve-all, trusted-owner auto-publish, risk-based   | Default **PENDING_REVIEW**; allow trusted-owner fast path later                         | Trust/safety vs time-to-publish                 |
| D5  | **Map provider**               | Leaflet+OSM, Mapbox, Google Maps                      | Leaflet+OSM default; abstract tiles/geocoding for swap                                  | Cost, keys, UX quality                          |
| D6  | **Image pipeline**             | R2+Cloudflare Images, S3+imgproxy, Cloudinary         | Pick one variant URL strategy (recommend R2/S3-compatible + CDN transforms)             | Cost, latency, vendor lock-in                   |
| D7  | **Currency/locale**            | BDT-only, multi-currency; bn/en                       | BDT-first, formatting helpers, bn/en copy hooks                                         | Market fit, i18n effort                         |
| D8  | **Search backend**             | Postgres-only vs external index now                   | Postgres-first; define trigger for Meilisearch/Typesense (latency/relevance/scale)      | Complexity vs capability                        |
| D9  | **App shape**                  | Single `web` app vs split portal/platform/storefront  | Single `apps/web` with route groups for MVP; split later if needed (zylosync precedent) | Dev speed vs separation                         |
| D10 | **Soft-delete vs hard-delete** | Cascade delete vs archive flags                       | Prefer archive/status for listings in prod; hard-delete for drafts/media cleanup        | Recovery, analytics, legal                      |

## 2. Risks and mitigations

| Risk                                              | Likelihood  | Impact                 | Mitigation                                                                                              |
| ------------------------------------------------- | ----------- | ---------------------- | ------------------------------------------------------------------------------------------------------- |
| **Owner drop-off during listing**                 | High        | Fewer listings         | 2-stage wizard, steppers, live preview, draft autosave, **Save & Clone**, minimal required fields first |
| **Low listing quality / fake posts**              | Medium-High | Trust erosion          | Moderation queue, required photos/tags, map pin, report flow, owner verification later                  |
| **Spam inquiries / scraped contacts**             | Medium      | Owner annoyance, churn | Rate limits, captcha/OTP-gated actions, contact masking/reveal policy, spam status                      |
| **Slow search / poor relevance at scale**         | Medium      | Bad renter UX          | Proper indexes from MVP, pagination, query profiling; external search index when triggered              |
| **Image cost/bandwidth/perf issues**              | Medium      | Slow pages, high cost  | Presigned direct upload, size/count limits, CDN transforms/WebP, lazy-loading                           |
| **Data inconsistency (floor bounds, duplicates)** | Medium      | Broken UX/trust        | DB uniqueness + app validation, transactional clone, constrained floor dropdowns                        |
| **Auth/OTP abuse or cost spikes**                 | Medium      | Cost/security          | OTP TTL/attempt limits, throttling, provider monitoring, fallback channels                              |
| **Map/geocoding inaccuracies**                    | Medium      | Renter confusion       | Draggable pin, address text required, area taxonomy, manual correction path                             |
| **Scope creep (split apps/features too early)**   | Medium      | Delayed MVP            | Strict P1 scope, single web app, Postgres-first search, feature flags for P3+                           |
| **Privacy/legal (PII, contact, tenancy data)**    | Low-Medium  | Compliance/reputation  | Minimal PII collection, clear visibility rules, retention/delete policy, ToS/privacy before launch      |

## 3. Assumptions (validate)

- Target market benefits from BD-specific fields (line gas, high/low commode, verandas, family/bachelor prefs) — keep schema flexible.
- One owner manages multiple buildings and many similar units per building (clone is high value).
- Initial volume fits Postgres-first search and a single-region deployment.
- Renters will use both list and (later) map discovery; mobile is primary.

## 4. Dependencies & integrations

| Dependency            | Purpose            | Phase            | Fallback/notes                                |
| --------------------- | ------------------ | ---------------- | --------------------------------------------- |
| Postgres provider     | primary DB         | P1               | local Docker in dev                           |
| S3-compatible storage | media originals    | P1               | MinIO local                                   |
| CDN/image transform   | optimized delivery | P1-P2            | basic originals first, optimize quickly       |
| Map tiles/geocoding   | pin & discovery    | P1-P2            | OSM tiles no-key; geocode optional/manual pin |
| Email service         | auth/notifications | P1/P3            | console/mailpit in dev                        |
| SMS/WhatsApp provider | OTP & alerts       | P1/P3 (decision) | email/OTP fallback paths                      |
| Captcha/anti-bot      | abuse control      | P2-P3            | rate limits first                             |

## 5. Definition of readiness (pre-launch checklist)

- [ ] MVP flows pass: owner create building → add/clone units → upload/tag photos → publish/approve → renter search/filter → view detail → inquire.
- [ ] RBAC/ownership enforced on all mutations; public endpoints expose only approved/listable data.
- [ ] Migrations reproducible; seed/demo works; backups configured for prod DB.
- [ ] Rate limits on auth/OTP/inquiry/search; basic abuse/report handling.
- [ ] Image limits/transforms and CDN caching in place.
- [ ] Monitoring/logging/error tracking and health checks enabled.
- [ ] Terms/privacy, contact policy, and moderation guidelines defined.
- [ ] Env/secrets managed securely; HTTPS and CORS restricted.
