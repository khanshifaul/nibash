# nibash — plans

Multi-building apartment rental listing platform. All planning docs live in this folder.

## Quick summary

- **What:** Building-first rental marketplace — landlords add a building once, then add flats inside it; renters search by area/budget/rooms/amenities and request visits.
- **Repo:** `@nibash/web` (Next.js 16) + `@nibash/api` (NestJS 11, Prisma 7, PostgreSQL), Bun monorepo.
- **Core idea:** `Building → Apartments (floors/units)` hierarchy with inherited amenities, room-tagged photos, one-click availability, and "Save & Clone" for identical floors.

## Plan index

| Doc                                                        | Purpose                                                                  | Audience                       |
| ---------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------ |
| [plain-english.md](plain-english.md)                       | What nibash is, how it works, who uses it — no jargon                    | Everyone                       |
| [product-and-architecture.md](product-and-architecture.md) | Product scope, system architecture, modules, cross-cutting concerns      | Product + engineering          |
| [domain-model.md](domain-model.md)                         | Entities, fields, enums, relations, constraints, indexes                 | Engineering                    |
| [ux-and-flows.md](ux-and-flows.md)                         | Screens, wizards (Stage A/B), search/detail UX, owner/renter/admin flows | Product + design + engineering |
| [api-and-routes.md](api-and-routes.md)                     | REST modules/endpoints and Next.js route map                             | Engineering                    |
| [stack-and-infra.md](stack-and-infra.md)                   | Tech stack, local dev, environments, deployment, media/maps              | Engineering                    |
| [roadmap.md](roadmap.md)                                   | Phased delivery, milestones, acceptance criteria                         | Everyone                       |
| [decisions-and-risks.md](decisions-and-risks.md)           | Open decisions, tradeoffs, risks, mitigations                            | Product + engineering          |

## MVP definition of done

- Owner creates a building once, adds/clones flats across floors with inherited amenities and room-tagged photos, toggles availability, and submits for moderation.
- Renter searches/filters, views flat + building details with dual galleries and transparent cost breakdown, and submits an inquiry/visit request.
- Admin reviews and approves/suspends listings.
- Delivered as a Bun monorepo: `apps/web` + `apps/api` + Prisma/Postgres + S3-compatible media.
