import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/cities?q=par&region=Europe
router.get('/', (req, res) => {
  const { q, region } = req.query;
  let sql = 'SELECT * FROM cities WHERE 1=1';
  const params = [];
  if (q) {
    sql += ' AND (name LIKE ? OR country LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }
  if (region) {
    sql += ' AND region = ?';
    params.push(region);
  }
  sql += ' ORDER BY popularity DESC LIMIT 50';
  const rows = db.prepare(sql).all(...params);
  res.json({ cities: rows });
});

router.get('/:id/activities', (req, res) => {
  const rows = db.prepare('SELECT * FROM activity_catalog WHERE city_id = ? ORDER BY category, cost').all(req.params.id);
  res.json({ activities: rows });
});

export default router;
