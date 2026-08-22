# spec.md — GlobeTrotter

## Problem statement (source)
Multi-city travel planner. Users create trips, add city "stops" with dates, assign activities (with cost/duration) to each stop, and get an auto-computed budget and calendar view. Public read-only sharing. See `GlobeTrotter.pdf` (original upload) for the full 13-screen brief; admin/analytics dashboard is explicitly marked optional there.

## Stack decisions
- **Backend:** Node + Express, `better-sqlite3` (synchronous, zero-config, file-based — fastest path to a working MVP; swap for `pg` + connection pooling if this goes multi-instance).
- **Auth:** JWT (7-day expiry), bcrypt password hashes. No refresh tokens, no email verification — fine for a demo, not for production.
- **Frontend:** React 19 + Vite, React Router v6, Recharts for the budget pie chart. No global state library — auth lives in a single Context, everything else is fetched per-page.
- **Styling:** hand-rolled CSS variables in `client/src/theme.css`, inline styles in components (no CSS framework/Tailwind). Dark "night flight" palette: ink navy background, sunset-coral primary accent, ocean-teal secondary.

## Data model (SQLite, see `server/db.js` for exact DDL)
```
users(id, name, email, password_hash, created_at)
cities(id, name, country, region, cost_index, popularity, blurb)          -- seeded, read-only reference
activity_catalog(id, city_id, name, category, cost, duration_hours, description)  -- seeded, read-only reference
trips(id, user_id, name, start_date, end_date, description, cover_photo, is_public, share_slug, created_at)
stops(id, trip_id, city_id, city_name, country, start_date, end_date, order_index)
activities(id, stop_id, name, category, cost, duration_hours, day_offset, notes)
```
Note: `stops.city_name`/`country` are denormalized copies (not just a `city_id` FK) so a stop can exist even for a city typed in manually and not in the seed catalog — deliberate, keep this if extending city search to a real API.

## API surface (all under `/api`, see `server/routes/*.js`)
- `POST /auth/register`, `POST /auth/login`, `GET /auth/me` (bearer token)
- `GET/POST /trips`, `GET/PUT/DELETE /trips/:id`, `GET /trips/:id/budget`, `POST /trips/:id/share`
- `POST/PUT/DELETE /trips/:id/stops[/:stopId]`
- `POST/DELETE /trips/:tripId/stops/:stopId/activities[/:activityId]`
- `GET /cities?q=&region=`, `GET /cities/:id/activities`
- `GET /public/:slug` (no auth — public share view)

All trip/stop/activity mutations re-return the full `trip` object (with nested `stops[].activities[]`) so the frontend never has to stitch partial updates together — keep this pattern if adding more mutation endpoints.

## Budget calculation (`server/routes/trips.js` → `computeBudget`)
`Activities` = sum of real activity costs. `Stay` = nights × $60 flat placeholder. `Transport` = stop count × $120 flat placeholder. Both placeholders are clearly labeled as estimates in the UI (`BudgetPanel.jsx`). Replacing these with real numbers (a per-city cost-of-living multiplier from `cities.cost_index`, or actual flight/hotel price lookups) is the natural next milestone.

## Known gaps / where to pick up
See `progress.md` for the milestone-style breakdown and `README.md` for setup + limitations already documented in the handoff.
