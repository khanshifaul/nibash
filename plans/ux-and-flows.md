# nibash — UX and flows

## 1. User journeys (end-to-end)

### 1.1 Owner: first listing

1. Sign up / verify (email or phone OTP) → role OWNER.
2. **Stage A:** Add building (identity → map pin → amenities → exterior photos) → save.
3. Land on **Building Hub** (summary, amenities, photos, 0 units).
4. **Stage B:** Add first flat (floor/unit → room steppers → utilities/prefs → pricing → tagged interior photos) → Publish (or Save Draft).
5. (Optional) **Save & Clone** for next identical floor → adjust label/floor/photos → Publish.
6. Submit for review if moderation required → listing goes live when approved.

### 1.2 Owner: ongoing management

- Toggle flat **Available/Rented/Maintenance** from hub/list.
- Edit building amenities/address/photos once; all flats reflect inherited info.
- View inquiry inbox, update lead status, schedule visits.
- Track portfolio: total buildings/units, occupancy, active inquiries.

### 1.3 Renter: discovery to lead

1. Land on home/search (SEO entry).
2. Filter by area, rent, beds/baths/verandas/size/floor, lift/parking/generator.
3. Open listing detail → inspect **apartment gallery** and **building gallery**, spec grid, cost breakdown, map/location.
4. Save favorite and/or **Request a visit** / send message / call-WhatsApp.
5. Track inquiry/visit status in renter portal (P3).

### 1.4 Admin: trust & safety

1. Open moderation queue (pending buildings/units).
2. Review details/photos/location → Approve / Reject (reason) / Suspend.
3. Feature/unfeature buildings; handle reports and user abuse.

## 2. Information architecture (web routes)

| Area        | Route group / path                                                                                                                                              | Purpose                            |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Public      | `(public)/` → `/`, `/search`, `/listings/[id]`, `/buildings/[id]`                                                                                               | discovery, SEO, detail             |
| Auth        | `(auth)/` → sign-in, sign-up, verify, forgot/reset                                                                                                              | access                             |
| Owner       | `(protected)/owner/` → dashboard, buildings, buildings/new, buildings/[id], buildings/[id]/edit, buildings/[id]/apartments/new, apartments/[id]/edit, inquiries | portfolio & listing ops            |
| Renter      | `(protected)/renter/` → saved, inquiries                                                                                                                        | bookmarks & lead tracking          |
| Admin       | `(protected)/admin/` → moderation, featured, users/reports                                                                                                      | governance                         |
| API helpers | `app/api/*`                                                                                                                                                     | revalidate/proxy only where needed |

## 3. Stage A — Add Building wizard (detailed)

### Layout

- **Desktop:** split view — form (left, ~70%) + **live building preview card** (right, ~30%).
- **Mobile:** single column; preview collapsible/drawer.
- Progress: Step 1 of 2 (Info & Amenities) → Step 2 of 2 (Photos) or single-page sections with clear anchors (match implementation preference; keep steps explicit).

### Step/Section 1: Basic identity

- Building/House Name _(required, max ~80 chars)_
- Total Floors _(required, 1–50; drives floor dropdown in Stage B)_

### Step/Section 1: Location & map

- Area/Neighborhood _(required, searchable select)_
- Road/Block/House No. _(required)_
- Full Street Address _(required)_
- **Map pin:** auto-center on area; drag to exact gate → stores `lat,lng`

### Step/Section 1: Amenities & infrastructure (toggle cards + conditional fields)

| Toggle           | When ON, show                                     |
| ---------------- | ------------------------------------------------- |
| Lift/Elevator    | Count (1, 2, 3+)                                  |
| Parking Space    | Type (Covered/Open, Car/Bike/Car+Bike, Free/Paid) |
| Backup Generator | Scope (Full building / Common areas)              |
| 24/7 Security    | Guard, CCTV, Intercom (multi-select)              |
| Rooftop Access   | —                                                 |
| Submersible Pump | —                                                 |

### Step/Section 2: Building photos

- Multi-file drag & drop (recommended: front, gate, garage, lobby, rooftop)
- Min 1, max N (e.g. 10); reorderable; first/selected = **Cover**
- Captions optional (e.g. "Front View", "Parking")

**Actions:** Cancel, Save draft, Save & Continue/Add Apartments. **Validation:** required fields, valid coords, at least one image (policy).

## 4. Stage B — Add Floor & Apartment wizard (detailed)

### Layout

- Context header: building name + inherited badges (Lift/Parking/Generator/Security) with **Edit Building** link.
- **Live listing preview** (desktop side or mobile preview modal/sheet) showing cover image, price, room summary, unit/floor, inherited amenities.
- **Mobile sticky footer:** estimated total (rent+service) + Preview + primary action.

### Section 1: Floor & unit identification

- Floor Number _(dropdown constrained by building.totalFloors: Ground/1st…Nth)_
- Unit/Flat Label _(required, unique per floor: A1, 4B, North-West)_
- Facing/Direction _(select)_
- Size (Sq. Ft.) _(number)_
- Availability: Available now / Rented / Maintenance / Coming soon (date picker when scheduled)

### Section 2: Room configuration (counter steppers, tap +/−)

| Room            | Range | Sub-options                                    |
| --------------- | ----- | ---------------------------------------------- |
| Bedrooms        | 0–10  | Attached baths count                           |
| Bathrooms       | 0–10  | High/Low commode count (optional but valuable) |
| Dining Space    | 0–3   | —                                              |
| Drawing/Living  | 0–3   | —                                              |
| Kitchen         | 0–5   | —                                              |
| Veranda/Balcony | 0–5   | —                                              |

### Section 3: Utilities & tenant preferences

- Gas Connection: Piped/Line, Cylinder, LPG Central, None
- Water/Electricity billing: Prepaid meter / Separate bill / Included (as applicable)
- Preferred tenant type (multi-select): Family, Bachelor (Male), Bachelor (Female), Any

### Section 4: Rent & charges

- Monthly Rent _(required)_
- Service/Maintenance Charge
- Security Deposit / Advance (amount or months)
- Show computed totals in preview (monthly, move-in)

### Section 5: Apartment interior photos (tagged)

- Multi-upload; **each image gets a mandatory room tag** dropdown (Master Bedroom, Bedroom, Dining, Drawing, Kitchen, Washroom, Veranda, Other)
- Reorderable gallery; guidance text for recommended shots

### Actions & behaviors

- **Save as Draft:** persist, hidden from public.
- **Publish Apartment:** validate completeness, set published/listable state (subject to moderation).
- **Save & Clone for Another Floor:**
  1. Persist current unit.
  2. Open new form pre-filled with size/rooms/utilities/prefs/pricing/facing.
  3. Clear `unitLabel` and `images`.
  4. Auto-increment/suggest next `floorNumber` (and suggest label pattern if possible).
  5. Owner adjusts and saves/publishes/clones again.
- **Autosave/draft recovery (P2):** reduce drop-off on long forms.

## 5. Public listing & search UX

### Search page

- **Filters (URL-synced):** area/keyword, rent min/max, bedrooms, bathrooms, verandas, min sqft, floor include/exclude (e.g. exclude ground), must-have lift/parking/generator/security/rooftop, availability.
- **Views:** list/grid and map view (P2) with synced bounds/markers.
- **Cards:** cover photo, rent, beds/baths/verandas, floor/unit label, building name/area, key amenity badges, availability.
- **States:** loading skeletons, empty/no-results guidance, pagination or infinite/load-more.

### Listing detail page

- **Gallery:** tabs/toggle — _Apartment photos_ (filterable by room tag) and _Building & exterior photos_.
- **Header:** price, unit label, floor, building name, area/address, availability badge.
- **Spec grid:** structured icons/labels for all room counts, size, facing, floor, gas, tenant prefs.
- **Building amenities:** inherited badges (lift count, parking type, generator, security, rooftop).
- **Cost breakdown:** Monthly Rent + Service Charge + Security/Advance = clear totals.
- **Map:** pin/location context.
- **CTAs:** Request a visit (date/time + message), Call/WhatsApp (policy-gated), Save/Favorite, Share, Report.

## 6. Owner dashboard & management

- **Portfolio metrics:** total buildings, total units, available/rented/maintenance counts, occupancy rate, active inquiries.
- **Buildings list:** cover, name/area, floors, unit counts, status; quick actions.
- **Building Hub:** building details + photo strip + amenities; unit table/cards by floor with status toggle, edit, clone shortcut.
- **Inquiries inbox:** filters by status/building/unit; detail drawer/page; status transitions and notes.

## 7. Admin UX

- **Moderation queue:** pending buildings/units with owner info, photos, map/location, flags.
- **Actions:** Approve, Reject (reason), Suspend/Unsuspend, Feature/Unfeature.
- **User/report management:** search users/listings, handle abuse reports, ban/unban per policy.

## 8. Cross-cutting UX requirements

- **Responsive:** mobile-first forms, steppers usable on touch, sticky actions on mobile.
- **Accessibility:** labeled controls, keyboard/focus, contrast, alt text/captions for images.
- **Performance:** lazy-load galleries, optimized images, fast filter interactions.
- **Trust cues:** verified/approved badges, clear moderation states, transparent costs, report action.
- **Empty/error states:** helpful guidance (e.g. "add your first building", no results suggestions).
