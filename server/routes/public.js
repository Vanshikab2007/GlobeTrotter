import { Router } from 'express';
import db from '../db.js';

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

export default router;
