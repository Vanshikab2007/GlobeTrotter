import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

  const password_hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(name, email.toLowerCase(), password_hash);
  const user = { id: info.lastInsertRowid, name, email: email.toLowerCase() };
  const token = signToken(user);
  res.status(201).json({ token, user });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const user = { id: row.id, name: row.name, email: row.email };
  const token = signToken(user);
  res.json({ token, user });
});

router.get('/me', requireAuth, (req, res) => {
  const row = db.prepare('SELECT id, name, email, profile_photo, city, country, phone_number, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!row) return res.status(404).json({ error: 'User not found' });
  res.json({ user: row });
});

router.put('/me', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!row) return res.status(404).json({ error: 'User not found' });
  
  const { name, email, city, country, phone_number, profile_photo } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

  let photoUrl = row.profile_photo;
  
  // Handle profile photo upload (base64)
  if (profile_photo && profile_photo.startsWith('data:image/')) {
    const matches = profile_photo.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      const fs = require('fs');
      const path = require('path');
      const dirPath = path.join(process.cwd(), '../client/public/images/users');
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      const fileName = `user_${req.user.id}.${extension}`;
      const filePath = path.join(dirPath, fileName);
      fs.writeFileSync(filePath, buffer);
      photoUrl = `/images/users/${fileName}`;
    }
  } else if (profile_photo === null || profile_photo === '') {
    photoUrl = null;
  } else if (profile_photo && !profile_photo.startsWith('data:image/')) {
    photoUrl = profile_photo;
  }

  try {
    db.prepare(`UPDATE users SET name = ?, email = ?, city = ?, country = ?, phone_number = ?, profile_photo = ? WHERE id = ?`)
      .run(name, email.toLowerCase(), city || null, country || null, phone_number || null, photoUrl, req.user.id);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed: users.email')) {
      return res.status(409).json({ error: 'Email already in use by another account' });
    }
    return res.status(500).json({ error: 'Failed to update profile' });
  }

  const updated = db.prepare('SELECT id, name, email, profile_photo, city, country, phone_number, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: updated });
});

router.post('/forgot-password', (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const row = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (!row) {
    // Return 200 even if not found to prevent email enumeration
    return res.json({ ok: true, message: 'If an account exists, a reset link was generated.' });
  }

  // Generate a random token
  import('crypto').then(crypto => {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now

    db.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?')
      .run(token, expires, row.id);

    // In a real app, send an email here.
    // For this demo, we'll return the token so the frontend can display it in a mock email UI.
    res.json({ ok: true, resetToken: token });
  });
});

router.post('/reset-password', (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ error: 'Token and new password required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const row = db.prepare('SELECT id, reset_token_expires FROM users WHERE reset_token = ?').get(token);
  if (!row) return res.status(400).json({ error: 'Invalid or expired token' });

  if (new Date(row.reset_token_expires) < new Date()) {
    return res.status(400).json({ error: 'Token has expired' });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?')
    .run(password_hash, row.id);

  res.json({ ok: true });
});

export default router;
