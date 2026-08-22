import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();


// GET /api/public/:slug - read-only shared itinerary, no auth required
router.get('/:slug', (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE share_slug = ? AND is_public = 1').get(req.params.slug);
  if (!trip) return res.status(404).json({ error: 'This trip is not shared or does not exist' });
  const stops = db.prepare('SELECT * FROM stops WHERE trip_id = ? ORDER BY order_index, start_date').all(trip.id);
  for (const stop of stops) {
    stop.activities = db.prepare('SELECT * FROM activities WHERE stop_id = ? ORDER BY day_offset, id').all(stop.id);
  }
  trip.stops = stops;
  res.json({ trip });
});

// POST /api/public/:slug/copy - copy shared trip to my account
router.post('/:slug/copy', requireAuth, (req, res) => {
  const sourceTrip = db.prepare('SELECT * FROM trips WHERE share_slug = ? AND is_public = 1').get(req.params.slug);
  if (!sourceTrip) return res.status(404).json({ error: 'This trip is not shared or does not exist' });
  
  let newTripId = null;
  
  db.transaction(() => {
    // 1. Copy trip
    const info = db.prepare(`INSERT INTO trips (user_id, name, start_date, end_date, description, cover_photo)
      VALUES (?, ?, ?, ?, ?, ?)`).run(req.user.id, `Copy of ${sourceTrip.name}`, sourceTrip.start_date, sourceTrip.end_date, sourceTrip.description, sourceTrip.cover_photo);
    
    newTripId = info.lastInsertRowid;
    
    // 2. Copy stops
    const stops = db.prepare('SELECT * FROM stops WHERE trip_id = ?').all(sourceTrip.id);
    for (const stop of stops) {
      const stopInfo = db.prepare(`INSERT INTO stops (trip_id, city_id, city_name, country, start_date, end_date, order_index)
        VALUES (?, ?, ?, ?, ?, ?, ?)`).run(newTripId, stop.city_id, stop.city_name, stop.country, stop.start_date, stop.end_date, stop.order_index);
      
      const newStopId = stopInfo.lastInsertRowid;
      
      // 3. Copy activities
      const activities = db.prepare('SELECT * FROM activities WHERE stop_id = ?').all(stop.id);
      for (const a of activities) {
        db.prepare(`INSERT INTO activities (stop_id, name, category, cost, duration_hours, day_offset, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?)`).run(newStopId, a.name, a.category, a.cost, a.duration_hours, a.day_offset, a.notes);
      }
    }
  })();
  
  res.json({ newTripId });
});

export default router;
