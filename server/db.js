import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'globetrotter.db');

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT,
  cost_index INTEGER,
  popularity INTEGER,
  blurb TEXT
);

CREATE TABLE IF NOT EXISTS activity_catalog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  city_id INTEGER NOT NULL REFERENCES cities(id),
  name TEXT NOT NULL,
  category TEXT,
  cost REAL,
  duration_hours REAL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS trips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  description TEXT,
  cover_photo TEXT,
  is_public INTEGER DEFAULT 0,
  share_slug TEXT UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  city_id INTEGER REFERENCES cities(id),
  city_name TEXT NOT NULL,
  country TEXT,
  start_date TEXT,
  end_date TEXT,
  order_index INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stop_id INTEGER NOT NULL REFERENCES stops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  cost REAL DEFAULT 0,
  duration_hours REAL,
  day_offset INTEGER DEFAULT 0,
  notes TEXT
);
`);

// Seed reference data only once
const cityCount = db.prepare('SELECT COUNT(*) as c FROM cities').get().c;
if (cityCount === 0) {
  const cities = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed/cities.json'), 'utf-8'));
  const activities = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed/activities.json'), 'utf-8'));

  const insertCity = db.prepare(`INSERT INTO cities (name, country, region, cost_index, popularity, blurb)
    VALUES (@name, @country, @region, @cost_index, @popularity, @blurb)`);
  const cityIdByName = {};
  const insertCities = db.transaction((rows) => {
    for (const c of rows) {
      const info = insertCity.run(c);
      cityIdByName[c.name] = info.lastInsertRowid;
    }
  });
  insertCities(cities);

  const insertActivity = db.prepare(`INSERT INTO activity_catalog (city_id, name, category, cost, duration_hours, description)
    VALUES (@city_id, @name, @category, @cost, @duration_hours, @description)`);
  const insertActivities = db.transaction((rows) => {
    for (const a of rows) {
      const city_id = cityIdByName[a.city];
      if (!city_id) continue;
      insertActivity.run({ ...a, city_id });
    }
  });
  insertActivities(activities);

  console.log(`Seeded ${cities.length} cities and ${activities.length} activities.`);
}

export default db;
