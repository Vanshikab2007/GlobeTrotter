import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/stats', requireAuth, (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    const totalTrips = db.prepare('SELECT COUNT(*) as c FROM trips').get().c;
    const totalStops = db.prepare('SELECT COUNT(*) as c FROM stops').get().c;
    const totalActivities = db.prepare('SELECT COUNT(*) as c FROM activities').get().c;

    const popularDestinations = db.prepare(`
      SELECT city_name, COUNT(*) as count 
      FROM stops 
      GROUP BY city_name 
      ORDER BY count DESC 
      LIMIT 10
    `).all();

    const usersGrowthRow = db.prepare(`
      SELECT COUNT(*) as count, date(created_at) as day 
      FROM users 
      GROUP BY day 
      ORDER BY day DESC 
      LIMIT 14
    `).all();

    res.json({
      stats: {
        totalUsers,
        totalTrips,
        totalStops,
        totalActivities,
      },
      popularDestinations,
      usersGrowth: usersGrowthRow.reverse(), // chronologically
    });
  } catch (error) {
    console.error('Error fetching admin stats', error);
    res.status(500).json({ error: 'Failed to fetch admin statistics' });
  }
});

export default router;
