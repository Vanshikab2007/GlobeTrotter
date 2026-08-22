import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import './db.js'; // initializes + seeds the database on import

import authRoutes from './routes/auth.js';
import tripRoutes from './routes/trips.js';
import cityRoutes from './routes/cities.js';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // allow larger base64 payloads

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);

// Fallback error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`GlobeTrotter API listening on port ${PORT}`);
});
