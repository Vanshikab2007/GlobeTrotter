# demo.md — GlobeTrotter demo script

Total time: ~3 minutes. Two terminal windows needed (backend + frontend), see `README.md` for exact commands.

## 1. The hook (10s)
"Planning a multi-city trip usually means five different spreadsheets and browser tabs. GlobeTrotter is one place to build the itinerary, see the budget, and share it — in real time, not mock screens."

## 2. Account + empty state (15s)
Register a new account live → land on an empty Dashboard. Point out the empty state has a clear call to action, not a dead end.

## 3. Create a trip (20s)
Click "Plan a trip" → name it ("Japan Adventure"), set real dates → immediately dropped into the Build tab for that trip. No intermediate confirmation step — friction removed on purpose.

## 4. Build the itinerary (60s) — this is the core of the demo
- "Add another stop" → search "Tokyo" → pick it → set arrival/departure dates. **This hits a live SQLite-backed search**, not a static list.
- "Add activity" on the Tokyo stop → filter by category (e.g. "Food") → add "Sushi Making Class" from the real seeded catalog.
- Add a **custom** activity too, to show both paths work (catalog + manual entry).
- Add a second stop (e.g. Kyoto) with its own activities — this is the multi-city part judges are scoring.

## 5. Show the payoff (45s)
- **Itinerary tab**: day-wise breakdown, grouped by city — "this is what the traveler actually follows."
- **Budget tab**: real total, pie chart, category breakdown. Call out that stay/transport are clearly-labeled estimates, not fake precision.
- **Calendar tab**: day-by-day timeline across the whole trip, color-coded by city.

## 6. Sharing (15s)
"Share trip" → open the generated `/share/:slug` link in a new incognito tab → show it's fully read-only and needs no login. "Anyone can view this without an account, ready to send to a travel buddy."

## 7. Close (10s)
"Everything you just saw is backed by a real database and a real API — no mock data on screen. What's next: in-place editing, drag-to-reorder, and smarter cost estimates."

## If something breaks live
- Backend down → restart with `npm start` in `server/` (auto re-seeds if `globetrotter.db` was deleted, otherwise picks up existing data instantly).
- Forgot the demo account password → just register a fresh one, takes 10 seconds.
- City search returns nothing → the catalog only covers 20 seeded cities (see `server/seed/cities.json`); stick to demoing with one of those (Tokyo, Paris, Bali, Jaipur, etc.) rather than typing an arbitrary city live.
