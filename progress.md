# progress.md — GlobeTrotter

## Status: MVP complete and verified working (this session)

Verified end-to-end via direct API testing (curl) and a clean frontend production build. Not yet verified in an actual browser (no browser/screenshot tool in this environment) — worth a quick manual click-through before a live demo.

## Done ✅

- **M1 — Auth**: register/login/JWT, protected routes on frontend, token persisted in localStorage and re-validated against `/auth/me` on load.
- **M2 — Trip CRUD**: create/list/view/delete. Dashboard groups trips into Ongoing / Upcoming / Completed by date.
- **M3 — Itinerary builder**: add/remove stops (city search modal, seeded catalog of 20 cities), add/remove activities per stop (catalog search filtered by category, or custom entry).
- **M4 — Itinerary view**: day-wise grouping per stop, driven by each activity's `day_offset`.
- **M5 — Budget**: real activity costs + placeholder stay/transport estimates, pie chart + category breakdown (Recharts).
- **M6 — Calendar/timeline**: day-by-day list across the full trip date range, color-coded by which stop occupies each day, same-day activities listed inline.
- **M7 — Public sharing**: `POST /trips/:id/share` generates a slug; `/share/:slug` is a fully unauthenticated read-only page.

## Explicitly deferred (not started)

- **Drag-to-reorder** stops/activities — currently order is insertion order + explicit dates; the wireframe shows drag handles, not implemented.
- **Editing** an existing stop's dates or an activity's fields after creation — currently add/delete only, no in-place edit.
- **Admin/analytics dashboard** — marked optional in the original problem statement, skipped entirely.
- **Cover photo upload** — `trips.cover_photo` column exists, no upload UI wired to it.
- **"Copy trip"** from a shared public view into your own account.
- **Real cost data** — stay/transport are flat placeholders, not looked up from any pricing source.
- **Password reset / "forgot password"** flow mentioned in the original brief's Login screen — not implemented.

## Suggested next milestones (in priority order)

1. Manual browser click-through of the full demo flow (see `demo.md`) to catch any UI issue automated testing wouldn't.
2. In-place editing for stops and activities — currently the biggest gap vs. the wireframe's "Build Itinerary" screen.
3. Drag-to-reorder for stops (order_index already exists in the schema, just needs a UI + PATCH call).
4. Replace flat budget placeholders with `cities.cost_index`-weighted estimates.
5. Admin dashboard, if time allows — it's the lowest-value screen per the original spec's own "(Optional)" tag.
