require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { pool } = require('./src/config/db');

const downloads = 'C:/Users/user/Downloads';

const files = {
  categories: 'categories.csv',
  users: 'users.csv',
  destinations: 'destinations.csv',
  tourpackages: 'tourpackages.csv',
  memories: 'memories.csv',
  mappins: 'mappins.csv',
  routeinquiries: 'routeinquiries.csv',
  bookinginquiries: 'bookinginquiries.csv',
  reviews: 'reviews.csv',
};

const readCsv = (name) => {
  const filePath = path.join(downloads, files[name]);
  if (!fs.existsSync(filePath)) throw new Error(`Missing CSV: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf8');
  return content.trim() ? parse(content, { columns: true, skip_empty_lines: true, bom: true }) : [];
};

const value = (row, key, fallback = null) => {
  const current = row[key];
  return current === undefined || current === '' ? fallback : current;
};

const number = (row, key, fallback = null) => {
  const current = value(row, key, fallback);
  if (current === null) return null;
  const parsed = Number(current);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const boolean = (row, key) => ['true', '1', 'yes', 't'].includes(String(value(row, key, '')).toLowerCase());
const removeExisting = async (client, table, id, email = null) => {
  if (email) {
    await client.query(`DELETE FROM ${table} WHERE id = $1 OR email = $2`, [id, email]);
  } else {
    await client.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
  }
};

const importCsv = async () => {
  const rows = Object.fromEntries(Object.keys(files).map((name) => [name, readCsv(name)]));
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, slug TEXT NOT NULL UNIQUE, description TEXT);
      CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user', phone TEXT);
      CREATE TABLE IF NOT EXISTS destinations (id SERIAL PRIMARY KEY, name TEXT NOT NULL, description TEXT, image_url TEXT, region TEXT NOT NULL DEFAULT '', rating NUMERIC(3, 2) DEFAULT 5, is_popular BOOLEAN NOT NULL DEFAULT false);
      CREATE TABLE IF NOT EXISTS tourpackages (id SERIAL PRIMARY KEY, title TEXT NOT NULL, price NUMERIC(10, 2) NOT NULL, duration TEXT NOT NULL, description TEXT, category TEXT NOT NULL, location TEXT, images_json TEXT, highlights TEXT);
      CREATE TABLE IF NOT EXISTS memories (id SERIAL PRIMARY KEY, title TEXT NOT NULL, image_url TEXT NOT NULL, summary TEXT, pinned BOOLEAN NOT NULL DEFAULT false);
      CREATE TABLE IF NOT EXISTS mappins (id SERIAL PRIMARY KEY, title TEXT NOT NULL, latitude NUMERIC(10, 7) NOT NULL, longitude NUMERIC(10, 7) NOT NULL, day_number INTEGER NOT NULL DEFAULT 1, details TEXT, photo_url TEXT, category TEXT);
      CREATE TABLE IF NOT EXISTS routeinquiries (id SERIAL PRIMARY KEY, user_id INTEGER, user_name TEXT NOT NULL, user_email TEXT NOT NULL, route_json TEXT NOT NULL, stops_json TEXT, travelers INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'Pending', notes TEXT, admin_notes TEXT);
      CREATE TABLE IF NOT EXISTS bookinginquiries (id SERIAL PRIMARY KEY, user_name TEXT NOT NULL, user_email TEXT NOT NULL, tour_id INTEGER NOT NULL, booking_date DATE NOT NULL, status TEXT NOT NULL DEFAULT 'pending', notes TEXT);
      CREATE TABLE IF NOT EXISTS reviews (id SERIAL PRIMARY KEY, tour_id INTEGER NOT NULL, user_name TEXT NOT NULL, comment TEXT NOT NULL, rating INTEGER NOT NULL, images_json TEXT);
      ALTER TABLE destinations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE tourpackages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE memories ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE mappins ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE routeinquiries ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE bookinginquiries ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE routeinquiries ADD COLUMN IF NOT EXISTS user_id INTEGER;
      ALTER TABLE routeinquiries ADD COLUMN IF NOT EXISTS user_name TEXT;
      ALTER TABLE routeinquiries ADD COLUMN IF NOT EXISTS user_email TEXT;
      ALTER TABLE routeinquiries ADD COLUMN IF NOT EXISTS route_json TEXT;
      ALTER TABLE routeinquiries ADD COLUMN IF NOT EXISTS stops_json TEXT;
      ALTER TABLE routeinquiries ADD COLUMN IF NOT EXISTS travelers INTEGER DEFAULT 1;
      ALTER TABLE routeinquiries ADD COLUMN IF NOT EXISTS admin_notes TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;
    `);

    for (const row of rows.categories) {
      await removeExisting(client, 'categories', number(row, 'id'));
      await client.query(`
        INSERT INTO categories (id, name, slug, description)
        VALUES ($1, $2, $3, $4)
      `, [number(row, 'id'), value(row, 'name'), value(row, 'slug'), value(row, 'description')]);
    }

    for (const row of rows.users) {
      await removeExisting(client, 'users', number(row, 'id'), value(row, 'email'));
      await client.query(`
        INSERT INTO users (id, name, email, password, role, phone)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [number(row, 'id'), value(row, 'name'), value(row, 'email'), value(row, 'password'), value(row, 'role', 'user'), value(row, 'phone')]);
    }

    for (const row of rows.destinations) {
      await removeExisting(client, 'destinations', number(row, 'id'));
      await client.query(`
        INSERT INTO destinations (id, name, description, image_url, region, rating, is_popular, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8::timestamptz, CURRENT_TIMESTAMP))
      `, [number(row, 'id'), value(row, 'name'), value(row, 'description'), value(row, 'image_url'), value(row, 'region', ''), number(row, 'rating', 5), boolean(row, 'is_popular'), value(row, 'created_at')]);
    }

    for (const row of rows.tourpackages) {
      await removeExisting(client, 'tourpackages', number(row, 'id'));
      await client.query(`
        INSERT INTO tourpackages (id, title, price, duration, description, category, location, images_json, highlights, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10::timestamptz, CURRENT_TIMESTAMP))
      `, [number(row, 'id'), value(row, 'title'), number(row, 'price', 0), value(row, 'duration', 'Flexible'), value(row, 'description'), value(row, 'category', 'General'), value(row, 'location'), value(row, 'images_json', '[]'), value(row, 'highlights'), value(row, 'created_at')]);
    }

    for (const row of rows.memories) {
      await removeExisting(client, 'memories', number(row, 'id'));
      await client.query(`
        INSERT INTO memories (id, title, image_url, summary, pinned, created_at)
        VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamptz, CURRENT_TIMESTAMP))
      `, [number(row, 'id'), value(row, 'title'), value(row, 'image_url'), value(row, 'summary'), boolean(row, 'pinned'), value(row, 'created_at')]);
    }

    for (const row of rows.mappins) {
      await removeExisting(client, 'mappins', number(row, 'id'));
      await client.query(`
        INSERT INTO mappins (id, title, latitude, longitude, day_number, details, photo_url, category, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9::timestamptz, CURRENT_TIMESTAMP))
      `, [number(row, 'id'), value(row, 'title'), number(row, 'latitude'), number(row, 'longitude'), number(row, 'day_number', 1), value(row, 'details'), value(row, 'photo_url'), value(row, 'category'), value(row, 'created_at')]);
    }

    for (const row of rows.routeinquiries) {
      await removeExisting(client, 'routeinquiries', number(row, 'id'));
      await client.query(`
        INSERT INTO routeinquiries (id, user_id, user_name, user_email, route_json, stops_json, travelers, status, notes, admin_notes, created_at, name, email)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, COALESCE($11::timestamptz, CURRENT_TIMESTAMP), $3, $4)
      `, [number(row, 'id'), number(row, 'user_id'), value(row, 'user_name'), value(row, 'user_email'), value(row, 'route_json', '[]'), value(row, 'stops_json', '[]'), number(row, 'travelers', 1), value(row, 'status', 'Pending'), value(row, 'notes'), value(row, 'admin_notes'), value(row, 'created_at')]);
    }

    for (const row of rows.bookinginquiries) {
      await removeExisting(client, 'bookinginquiries', number(row, 'id'));
      await client.query(`
        INSERT INTO bookinginquiries (id, user_name, user_email, tour_id, booking_date, status, notes, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8::timestamptz, CURRENT_TIMESTAMP))
      `, [number(row, 'id'), value(row, 'user_name'), value(row, 'user_email'), number(row, 'tour_id'), value(row, 'booking_date'), value(row, 'status', 'pending'), value(row, 'notes'), value(row, 'created_at')]);
    }

    for (const row of rows.reviews) {
      await removeExisting(client, 'reviews', number(row, 'id'));
      await client.query(`
        INSERT INTO reviews (id, tour_id, user_name, comment, rating, images_json, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7::timestamptz, CURRENT_TIMESTAMP))
      `, [number(row, 'id'), number(row, 'tour_id'), value(row, 'user_name'), value(row, 'comment'), number(row, 'rating', 5), value(row, 'images_json', '[]'), value(row, 'created_at')]);
    }

    for (const table of Object.keys(files)) {
      if (rows[table].length) {
        await client.query(`SELECT setval(pg_get_serial_sequence($1, 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM ${table}), 1), 1), true)`, [table]);
      }
    }

    await client.query('COMMIT');
    console.log(JSON.stringify(Object.fromEntries(Object.entries(rows).map(([name, values]) => [name, values.length]))));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

importCsv().catch((error) => {
  console.error(`CSV import failed: ${error.message}`);
  process.exitCode = 1;
});
