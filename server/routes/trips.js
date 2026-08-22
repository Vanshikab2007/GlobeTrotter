import { Router } from 'express';
import crypto from 'crypto';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function getTripWithDetail(tripId) {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
  if (!trip) return null;
  const stops = db.prepare(`
    SELECT stops.*, cities.cost_index 
    FROM stops 
    LEFT JOIN cities ON stops.city_id = cities.id 
    WHERE stops.trip_id = ? 
    ORDER BY stops.order_index, stops.start_date
  `).all(tripId);
  
  for (const stop of stops) {
    stop.activities = db.prepare('SELECT * FROM activities WHERE stop_id = ? ORDER BY day_offset, id').all(stop.id);
  }
  trip.stops = stops;
  return trip;
}

function computeBudget(trip) {
  let activitiesCost = 0;
  const byCategory = {};
  
  let estimatedStay = 0;
  let estimatedTransport = 0;
  let totalNights = 0;

  for (const stop of trip.stops) {
    for (const a of stop.activities) {
      activitiesCost += a.cost || 0;
      byCategory[a.category || 'Other'] = (byCategory[a.category || 'Other'] || 0) + (a.cost || 0);
    }
    
    const costIdx = stop.cost_index || 1;
    
    if (stop.start_date && stop.end_date) {
      const nights = Math.max(1, Math.round((new Date(stop.end_date) - new Date(stop.start_date)) / 86400000));
      totalNights += nights;
      estimatedStay += nights * 60 * costIdx;
    }
    estimatedTransport += 50 * costIdx;
  }

  const total = activitiesCost + estimatedStay + estimatedTransport;

  return {
    total: Math.round(total * 100) / 100,
    breakdown: {
      Activities: Math.round(activitiesCost * 100) / 100,
      Stay: Math.round(estimatedStay),
      Transport: Math.round(estimatedTransport),
    },
    byActivityCategory: byCategory,
    totalNights,
  };
}

function validateDates(start, end) {
  if (start && end && new Date(end) < new Date(start)) {
    throw new Error('End date cannot precede start date');
  }
}

function validateCostDuration(cost, duration) {
  if (cost !== undefined && cost !== null && cost < 0) throw new Error('Cost cannot be negative');
  if (duration !== undefined && duration !== null && duration < 0) throw new Error('Duration cannot be negative');
}

// GET /api/trips - list current user's trips
router.get('/', requireAuth, (req, res) => {
  const trips = db.prepare('SELECT * FROM trips WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  const withCounts = trips.map(t => {
    const stopCount = db.prepare('SELECT COUNT(*) as c FROM stops WHERE trip_id = ?').get(t.id).c;
    return { ...t, stopCount };
  });
  res.json({ trips: withCounts });
});

// POST /api/trips - create trip
router.post('/', requireAuth, (req, res) => {
  const { name, start_date, end_date, description, cover_photo } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Trip name is required' });
  
  try { validateDates(start_date, end_date); } 
  catch(e) { return res.status(400).json({ error: e.message }); }

  const info = db.prepare(`INSERT INTO trips (user_id, name, start_date, end_date, description, cover_photo)
    VALUES (?, ?, ?, ?, ?, ?)`).run(req.user.id, name, start_date || null, end_date || null, description || null, cover_photo || null);
  const trip = getTripWithDetail(info.lastInsertRowid);
  res.status(201).json({ trip });
});

// GET /api/trips/:id - full detail (stops + activities)
router.get('/:id', requireAuth, (req, res) => {
  const trip = getTripWithDetail(req.params.id);
  if (!trip || trip.user_id !== req.user.id) return res.status(404).json({ error: 'Trip not found' });
  res.json({ trip });
});

// PUT /api/trips/:id - update trip meta
router.put('/:id', requireAuth, (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id);
  if (!trip || trip.user_id !== req.user.id) return res.status(404).json({ error: 'Trip not found' });
  const { name, start_date, end_date, description, cover_photo } = req.body || {};
  
  try { validateDates(start_date ?? trip.start_date, end_date ?? trip.end_date); } 
  catch(e) { return res.status(400).json({ error: e.message }); }

  db.prepare(`UPDATE trips SET name = ?, start_date = ?, end_date = ?, description = ?, cover_photo = ? WHERE id = ?`)
    .run(name ?? trip.name, start_date ?? trip.start_date, end_date ?? trip.end_date,
         description ?? trip.description, cover_photo ?? trip.cover_photo, trip.id);
  res.json({ trip: getTripWithDetail(trip.id) });
});

// DELETE /api/trips/:id
router.delete('/:id', requireAuth, (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id);
  if (!trip || trip.user_id !== req.user.id) return res.status(404).json({ error: 'Trip not found' });
  db.prepare('DELETE FROM trips WHERE id = ?').run(trip.id);
  res.json({ ok: true });
});

// GET /api/trips/:id/budget
router.get('/:id/budget', requireAuth, (req, res) => {
  const trip = getTripWithDetail(req.params.id);
  if (!trip || trip.user_id !== req.user.id) return res.status(404).json({ error: 'Trip not found' });
  res.json({ budget: computeBudget(trip) });
});

// POST /api/trips/:id/share - toggle public sharing, returns slug
router.post('/:id/share', requireAuth, (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id);
  if (!trip || trip.user_id !== req.user.id) return res.status(404).json({ error: 'Trip not found' });
  let slug = trip.share_slug;
  if (!slug) slug = crypto.randomBytes(5).toString('hex');
  db.prepare('UPDATE trips SET is_public = 1, share_slug = ? WHERE id = ?').run(slug, trip.id);
  res.json({ share_slug: slug });
});

// --- Stops ---

// POST /api/trips/:id/stops - add a stop (city)
router.post('/:id/stops', requireAuth, (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id);
  if (!trip || trip.user_id !== req.user.id) return res.status(404).json({ error: 'Trip not found' });
  const { city_id, city_name, country, start_date, end_date } = req.body || {};
  if (!city_name || !start_date || !end_date) {
    return res.status(400).json({ error: 'city_name, start_date, and end_date are required' });
  }

  try { validateDates(start_date, end_date); } 
  catch(e) { return res.status(400).json({ error: e.message }); }

  const orderRow = db.prepare('SELECT COALESCE(MAX(order_index), -1) as m FROM stops WHERE trip_id = ?').get(trip.id);
  const info = db.prepare(`INSERT INTO stops (trip_id, city_id, city_name, country, start_date, end_date, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(trip.id, city_id || null, city_name, country || null, start_date, end_date, orderRow.m + 1);
  res.status(201).json({ trip: getTripWithDetail(trip.id), stop_id: info.lastInsertRowid });
});

router.put('/:tripId/stops/:stopId', requireAuth, (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.tripId);
  if (!trip || trip.user_id !== req.user.id) return res.status(404).json({ error: 'Trip not found' });
  const stop = db.prepare('SELECT * FROM stops WHERE id = ? AND trip_id = ?').get(req.params.stopId, trip.id);
  if (!stop) return res.status(404).json({ error: 'Stop not found' });
  const { start_date, end_date, order_index } = req.body || {};

  try { validateDates(start_date ?? stop.start_date, end_date ?? stop.end_date); } 
  catch(e) { return res.status(400).json({ error: e.message }); }

  db.prepare('UPDATE stops SET start_date = ?, end_date = ?, order_index = ? WHERE id = ?')
    .run(start_date ?? stop.start_date, end_date ?? stop.end_date, order_index ?? stop.order_index, stop.id);
  res.json({ trip: getTripWithDetail(trip.id) });
});

router.delete('/:tripId/stops/:stopId', requireAuth, (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.tripId);
  if (!trip || trip.user_id !== req.user.id) return res.status(404).json({ error: 'Trip not found' });
  db.prepare('DELETE FROM stops WHERE id = ? AND trip_id = ?').run(req.params.stopId, trip.id);
  res.json({ trip: getTripWithDetail(trip.id) });
});

// --- Activities ---

router.post('/:tripId/stops/:stopId/activities', requireAuth, (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.tripId);
  if (!trip || trip.user_id !== req.user.id) return res.status(404).json({ error: 'Trip not found' });
  const stop = db.prepare('SELECT * FROM stops WHERE id = ? AND trip_id = ?').get(req.params.stopId, trip.id);
  if (!stop) return res.status(404).json({ error: 'Stop not found' });

  const { name, category, cost, duration_hours, day_offset, notes } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Activity name is required' });

  try { validateCostDuration(cost, duration_hours); } 
  catch(e) { return res.status(400).json({ error: e.message }); }

  db.prepare(`INSERT INTO activities (stop_id, name, category, cost, duration_hours, day_offset, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(stop.id, name, category || 'Other', cost || 0, duration_hours || null, day_offset || 0, notes || null);
  res.status(201).json({ trip: getTripWithDetail(trip.id) });
});

router.put('/:tripId/stops/:stopId/activities/:activityId', requireAuth, (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.tripId);
  if (!trip || trip.user_id !== req.user.id) return res.status(404).json({ error: 'Trip not found' });
  const stop = db.prepare('SELECT * FROM stops WHERE id = ? AND trip_id = ?').get(req.params.stopId, trip.id);
  if (!stop) return res.status(404).json({ error: 'Stop not found' });
  
  const activity = db.prepare('SELECT * FROM activities WHERE id = ? AND stop_id = ?').get(req.params.activityId, stop.id);
  if (!activity) return res.status(404).json({ error: 'Activity not found' });

  const { name, category, cost, duration_hours, day_offset, notes } = req.body || {};

  try { validateCostDuration(cost ?? activity.cost, duration_hours ?? activity.duration_hours); } 
  catch(e) { return res.status(400).json({ error: e.message }); }

  db.prepare(`UPDATE activities SET name = ?, category = ?, cost = ?, duration_hours = ?, day_offset = ?, notes = ? WHERE id = ?`)
    .run(name ?? activity.name, category ?? activity.category, cost ?? activity.cost, 
         duration_hours ?? activity.duration_hours, day_offset ?? activity.day_offset, 
         notes ?? activity.notes, activity.id);
         
  res.json({ trip: getTripWithDetail(trip.id) });
});

router.delete('/:tripId/stops/:stopId/activities/:activityId', requireAuth, (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.tripId);
  if (!trip || trip.user_id !== req.user.id) return res.status(404).json({ error: 'Trip not found' });
  db.prepare('DELETE FROM activities WHERE id = ? AND stop_id = ?').run(req.params.activityId, req.params.stopId);
  res.json({ trip: getTripWithDetail(trip.id) });
});

export default router;
