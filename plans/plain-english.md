# nibash — plain-English guide

**For:** anyone who wants to understand nibash without technical background.

---

## 1. What is nibash?
**nibash** (নিবাস, "residence") is a website for renting apartments in multi-story buildings.

Most rental sites treat every flat as a separate listing, so a landlord with 10 flats in one building must re-enter the same building info 10 times (address, lift, parking, security, gate photos). nibash fixes this by grouping flats inside buildings:

- **Building** = the whole apartment block (shared details: address, map location, total floors, lift, parking, generator, security, exterior photos).
- **Flat / Unit** = one home inside that building (its own floor, flat number like "4B", rooms, rent, interior photos, availability).

Add the building once → add flats inside it. Each flat automatically "inherits" the building's shared details.

---

## 2. Who uses nibash?

| Person | Goal | What they can do |
|---|---|---|
| **Landlord / Building owner** | Fill vacancies faster with less repeated work | Create buildings, add/clone flats, upload photos, set rent and deposit, mark available/rented, respond to visit requests, see portfolio stats. |
| **Renter / Tenant** | Find a suitable flat quickly and confidently | Search by area/budget/rooms/amenities, view flat + building photos, see full cost breakdown, save favorites, request a visit, contact owner. |
| **Platform admin** | Keep listings trustworthy and safe | Review/approve/reject listings, feature buildings on homepage, handle reports/spam, suspend abusive accounts or listings. |

---

## 3. The big idea: building first, flats second

### Why it helps landlords
- Enter address, map pin, lift/parking/generator/security **once per building**.
- Upload gate/lobby/parking/exterior photos **once per building**.
- Add many flats under the same building without repeating shared info.
- If floors have the same layout (common in apartment blocks), **clone** a flat to the next floor and only change the flat label and photos.

### Why it helps renters
- See both **inside-the-flat photos** and **building/exterior photos** in one place.
- Know building amenities (lift, parking, generator, guard/CCTV) clearly.
- Compare flats with consistent, structured details (bedrooms, bathrooms, dining, drawing, kitchen, verandas, floor, size).

---

## 4. How a landlord lists a property (step by step)

### Stage A — Add the building (once)
**Step 1: Identity & location**
- Building name (e.g., "Rose Garden Heights")
- Total floors
- Area/neighborhood (e.g., Dhanmondi)
- Road/block/house number and full address
- Pin exact location on a map (drag pin to the gate)

**Step 2: Shared facilities (amenities)**
- Lift/elevator? If yes, how many?
- Parking? Type (car, bike, both, paid/free/covered)
- Backup generator? Full building or common areas
- 24/7 security guard and/or CCTV? Intercom?
- Rooftop access? Submersible water pump?

**Step 3: Building photos**
- Upload exterior/common photos: front view, gate, parking, lobby, rooftop
- Pick one **cover photo**
- Save → goes to the **Building Hub** (the building's home page for the owner)

### Stage B — Add a flat/unit (repeat per flat)
Inside a building, the owner clicks "Add apartment" and fills:

**1) Floor & identity**
- Floor number (limited by building's total floors)
- Flat label (e.g., 4B, A1, North-West) — unique per floor
- Facing/direction (e.g., South-East)
- Size (sq. ft.)
- Availability: Available now / Rented / Maintenance / Coming soon (with date)

**2) Room configuration (tap + / − counters)**
- Bedrooms (and how many have attached bathrooms)
- Bathrooms (option: high/low commode count — useful for families)
- Dining space
- Drawing/living room
- Kitchen
- Verandas/balconies

**3) Utilities & tenant preferences**
- Gas: piped line / cylinder / central LPG / none
- Meter/billing: prepaid or separate/postpaid (as applicable)
- Preferred tenant: Family, Bachelor (Male), Bachelor (Female), or Any (can select multiple)

**4) Rent & charges (shown clearly to renters)**
- Monthly rent
- Monthly service/maintenance charge
- Security deposit / advance (e.g., 2 months)

**5) Interior photos (tagged by room)**
- Upload photos and tag each: Master Bedroom, Bedroom, Dining, Drawing, Kitchen, Washroom, Veranda, Other
- This lets renters filter/browse photos by room later

**Actions**
- **Save as Draft** — keep hidden until ready
- **Publish** — make visible to renters (subject to moderation rules)
- **Save & Clone for Another Floor** — saves this flat, then opens a new form pre-filled with the same size/rooms/utilities/rent/preferences; clears flat label and photos and moves to the next floor (or suggests it). Ideal for identical stacked layouts.

### Building Hub (owner view)
- Shows building summary, amenities, cover photo, occupancy (available/rented/maintenance counts)
- Lists all flats by floor/unit with quick status toggle
- Shortcuts: add flat, edit building, view inquiries

---

## 5. How a renter finds and evaluates a flat

### Search & filters
- **Location:** area/neighborhood (and map view in later phase)
- **Budget:** min/max monthly rent
- **Rooms & size:** bedrooms, bathrooms, verandas, minimum sq. ft.
- **Floor:** preferred floor or exclude ground floor
- **Building must-haves:** lift/elevator, parking, backup generator/power, security (guard/CCTV)

Results show cards with cover photo, rent, key room counts, floor/unit, building name, and amenity badges.

### Listing detail page (what a renter sees)
- **Two photo galleries (switchable tabs):**
  - *Apartment photos* — interior, organized/tagged by room (bedroom, kitchen, veranda, etc.)
  - *Building photos* — exterior, gate, parking, lobby, rooftop
- **Spec grid:** bedrooms, attached baths, bathrooms, dining, drawing, kitchen, verandas, size, floor, facing
- **Building badges:** lift, parking, generator, security, rooftop (inherited from building)
- **Transparent cost breakdown:** Monthly Rent + Service Charge + Security Deposit (and estimated total move-in/first-month context as shown)
- **Location:** address/area and map pin (where enabled)
- **Actions:** Request a visit (pick date/time), Call/WhatsApp (per platform policy), Save/Favorite, Report listing

---

## 6. Availability, inquiries, and trust

### Flat availability (owner-controlled)
| Status | Meaning | Visible to renters? |
|---|---|---|
| Available | Ready to rent now | Yes (if approved) |
| Coming soon | Available from a future date | Yes, with date (policy-dependent) |
| Rented | Occupied | No (kept for records/relisting) |
| Maintenance | Temporarily unavailable | No |

Owner can toggle status in one click without deleting the listing.

### Inquiries & visit requests
- Renter sends a message and/or requests a visit time.
- Owner sees requests in an inbox/dashboard and updates status: **Pending → Contacted → Scheduled → Closed** (or **Spam**).
- Notifications (email/SMS/WhatsApp hooks) planned in later phase.

### Moderation (admin)
- New buildings/flats may require approval before going public (to prevent fake/spam listings).
- Admin can approve, reject, suspend, or feature listings and manage abusive users/reports.

---

## 7. What gets built in phases

| Phase | When | What users get |
|---|---|---|
| **P1 — MVP** | Weeks 1–4 | Accounts, building+flat creation, photo uploads, basic search & listing pages, availability toggle, basic inquiry. |
| **P2 — UX & media** | Weeks 5–6 | Faster/optimized photos, room-tagged galleries, **Save & Clone**, map pin & map view, advanced filters, better mobile wizard/preview. |
| **P3 — Trust & engagement** | Weeks 7–8 | Visit scheduling & inbox workflow, notifications, favorites, admin approval/moderation, anti-spam measures. |
| **P4 — Growth** | After launch | Featured/boosted buildings, owner plans/subscriptions, analytics, stronger search/verification. |

---

## 8. Glossary
| Term | Meaning |
|---|---|
| Building | The whole apartment block; holds shared info and many flats. |
| Flat / Unit | One rentable home inside a building. |
| Building Hub | Owner's page for one building: summary, amenities, photos, and its flats. |
| Stage A | Wizard to add a building. |
| Stage B | Wizard to add a flat inside a building. |
| Inherit | Flat automatically shows the building's shared amenities/location info. |
| Clone | Copy a flat's layout/rent/settings to create a similar flat on another floor quickly. |
| Room tag | Label on a photo (Bedroom, Kitchen, Veranda, etc.). |
| Availability | Whether a flat can be rented now (Available/Rented/Maintenance/Coming soon). |
| Moderation | Admin review before/while a listing is public. |
| Inquiry | A renter's message or visit request to the owner. |
| Favorite | A saved listing for later. |

---

## 9. Success criteria (MVP, plain language)
- A landlord can list a whole building once and add many flats quickly (including cloning).
- A renter can find, understand, and trust a listing (rooms, amenities, photos, full cost) and contact/request a visit.
- An admin can keep fake or bad listings off the platform.
