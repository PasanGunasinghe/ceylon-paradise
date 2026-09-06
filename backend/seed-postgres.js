require('dotenv').config();

const { pool } = require('./src/config/db');
const {
  demoTours,
  demoDestinations,
  demoUsers,
  demoBookings,
  demoReviews,
} = require('./src/demoData');

const categories = [...new Set(demoTours.map((tour) => tour.category))].map((name) => ({
  name,
  slug: name.toLowerCase().replace(/\s+/g, '-'),
  description: `${name} tours in Sri Lanka`,
}));

const seed = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        description TEXT
      )
    `);

    for (const user of demoUsers) {
      await client.query(
        `INSERT INTO users (name, email, password, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role`,
        [user.name, user.email, user.password, user.role],
      );
    }

    for (const category of categories) {
      await client.query(
        `INSERT INTO categories (name, slug, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO UPDATE SET slug = EXCLUDED.slug, description = EXCLUDED.description`,
        [category.name, category.slug, category.description],
      );
    }

    for (const destination of demoDestinations) {
      await client.query('DELETE FROM destinations WHERE name = $1', [destination.name]);
      await client.query(
        `INSERT INTO destinations (name, description, image_url, region, rating, is_popular)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [destination.name, destination.description, destination.image_url, destination.location, 5, false],
      );
    }

    for (const tour of demoTours) {
      await client.query('DELETE FROM tourpackages WHERE title = $1', [tour.title]);
      await client.query(
        `INSERT INTO tourpackages (title, price, duration, description, category, location, images_json, highlights)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          tour.title,
          tour.price,
          tour.duration,
          tour.description,
          tour.category,
          tour.destination,
          JSON.stringify(tour.image_url ? [tour.image_url] : []),
          tour.itinerary,
        ],
      );
    }

    for (const booking of demoBookings) {
      await client.query(
        `DELETE FROM bookinginquiries
         WHERE user_email = $1 AND tour_id = $2 AND booking_date = $3`,
        [booking.user_email, booking.tour_id, booking.date],
      );
      await client.query(
        `INSERT INTO bookinginquiries (user_name, user_email, tour_id, booking_date, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [booking.user_name, booking.user_email, booking.tour_id, booking.date, booking.status, booking.notes],
      );
    }

    for (const review of demoReviews) {
      await client.query('DELETE FROM reviews WHERE tour_id = $1 AND user_name = $2', [review.tour_id, review.user_name]);
      await client.query(
        `INSERT INTO reviews (tour_id, user_name, comment, rating, images_json)
         VALUES ($1, $2, $3, $4, $5)`,
        [review.tour_id, review.user_name, review.review, review.rating, JSON.stringify(review.images || [])],
      );
    }

    await client.query('COMMIT');
    console.log(JSON.stringify({
      users: demoUsers.length,
      categories: categories.length,
      destinations: demoDestinations.length,
      tours: demoTours.length,
      bookings: demoBookings.length,
      reviews: demoReviews.length,
    }));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

seed().catch((error) => {
  console.error(`Seed failed: ${error.message}`);
  process.exitCode = 1;
});
