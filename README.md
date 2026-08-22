# GlobeTrotter — MVP

Dreaming up your next adventure? Globetrotter makes trip planning easy and fun organize your stops, track your budget, and get personalized recommendations, all in one place.

## Stack

- **Backend:** Node.js + Express + SQLite (`better-sqlite3`), JWT auth
- **Frontend:** React 19 + Vite, React Router, Recharts

No external APIs or paid services required — runs fully locally.

## Setup

### 1. Backend

```bash
cd server
npm install
cp .env.example .env   # optional, has safe local defaults
npm start               # runs on http://localhost:4000
```

The SQLite database (`server/globetrotter.db`) is created and seeded automatically on first run with 20 cities and 50+ activities across them.

### 2. Frontend

```bash
cd client
npm install
npm run dev             # runs on http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:4000`, so just open **http://localhost:5173**.

For a production build: `npm run build` (outputs to `client/dist`), served by any static host — point it at the deployed API's URL if the backend isn't on the same origin.

## Recommended demo flow

1. Sign up → new user lands on an empty Dashboard, ready to create their first trip.
2. Create a trip → enter a trip name and travel dates → instantly taken into the trip's Build tab.
3. Add a stop → search and select a city (e.g., Tokyo) → set arrival and departure dates for that leg.
4. Add activities → filter the activity catalog by category and add 2–3 activities to the stop, or create a custom one.
5. Add a second stop → repeat the process for another city to demonstrate multi-city itinerary support.
6. Reorder or edit stops → drag stops to resequence the trip, or edit dates/activities as plans change.
7. Explore the trip views → switch between:
8. Itinerary — day-by-day plan of the full trip
9. Budget — auto-calculated total spend with a visual pie chart breakdown
10. Calendar — timeline view of the entire trip
11. Share the trip → click "Share trip" and open the generated /share/:slug link in a new tab to preview the public, read-only version.
## What's implemented

- Auth (register/login/JWT), all main trip CRUD, stop + activity CRUD
- City search (20 seeded cities) and per-city activity catalog (50+ seeded activities) with category filtering
- Custom activity entry (name/category/cost/duration/day)
- Auto-computed budget: real activity costs + placeholder stay/transport estimates, category breakdown, pie chart
- Day-wise itinerary view grouped by stop
- Calendar/timeline view showing which city occupies each day, with same-day activities listed
- Public read-only share link per trip

## Intentionally left for the next phase

- Drag-to-reorder stops/activities (currently order is insertion order + explicit dates)
- Editing an existing stop's dates or an activity's details after creation (currently add/delete only)
- Admin/analytics dashboard (marked optional in the original spec)
- Real stay/transport costs (currently flat placeholder estimates — clearly labeled in the UI)
- Cover photo upload for trips (field exists in the schema, no upload UI yet)
- "Copy trip" from a shared public view

## Known limitations

- JWT secret falls back to a dev default if `.env` isn't set — fine for a local demo, must be set for any real deployment
- No rate limiting / no email verification
- SQLite is file-based — fine for a single-instance demo, would need Postgres for concurrent multi-instance deployment

See `spec.md`, `progress.md`, and `demo.md` for the fuller breakdown to continue building from.
