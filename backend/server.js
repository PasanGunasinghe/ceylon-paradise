const cors = require('cors');
const express = require('express');
const bcrypt = require('bcryptjs');
const sharp = require('sharp');
require('dotenv').config();

const { connectDB, sql, pool } = require('./src/config/db');
const { generateToken, authenticateToken, requireRole } = require('./src/auth');
const { state, getNextId } = require('./src/fallbackStore');

const app = express();
const allowedOrigins = new Set([
  'https://ceylon-paradise-jizyk7hev-pasan-gunasinghe.vercel.app',
  'http://localhost:5173',
]);
const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin) || /^https:\/\/.*\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use('/uploads', express.static('uploads'));
const PORT = process.env.PORT || 5000;
let databaseReady = false;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use((req, res, next) => {
  console.log("INCOMING PAYLOAD:", req.method, req.url, req.body);
  next();
});

app.get('/', (req, res) => {
  res.json({ message: 'Ceylon Paradise Expeditions API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: databaseReady ? 'connected' : 'demo-mode' });
});

const normalizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
});

const isDatabaseDown = () => !databaseReady;

const compressImageToWebp = async (image) => {
  if (!image || typeof image !== 'string') return '';

  if (image.startsWith('http')) return image;

  try {
    const match = image.match(/^data:image\/(png|jpg|jpeg|webp);base64,(.+)$/i);
    if (!match) return image;

    const buffer = Buffer.from(match[2], 'base64');
    const compressed = await sharp(buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    return `data:image/webp;base64,${compressed.toString('base64')}`;
  } catch (error) {
    return image;
  }
};

const serializeJsonField = (value) => {
  if (value === undefined || value === null || value === '') return '';
  return typeof value === 'string' ? value : JSON.stringify(value);
};

const parseJsonField = (value) => {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return value; }
};

const compressImageValue = async (value) => {
  if (Array.isArray(value)) return Promise.all(value.map(compressImageToWebp));
  return compressImageToWebp(value);
};

const fetchTours = async () => {
  if (isDatabaseDown()) return [...state.tours];

  const result = await pool.request().query(`SELECT id, title, price, duration, description, category,
    location AS destination, images_json AS image_url, highlights AS itinerary,
    'Available' AS availability FROM dbo.TourPackages ORDER BY id`);
  return result.recordset;
};

const fetchDestinations = async () => {
  if (isDatabaseDown()) return [...state.destinations];

  const result = await pool.request().query('SELECT id, name, description, image_url, region AS location, rating, is_popular FROM dbo.Destinations ORDER BY id');
  return result.recordset;
};

const fetchBookings = async () => {
  if (isDatabaseDown()) return [...state.bookings];

  const result = await pool.request().query('SELECT id, user_name, user_email, tour_id, booking_date AS date, status, notes FROM dbo.BookingInquiries ORDER BY id');
  return result.recordset;
};

const fetchUsers = async () => {
  if (isDatabaseDown()) return state.users.map(normalizeUser);

  const result = await pool.request().query('SELECT * FROM dbo.Users ORDER BY id');
  return result.recordset;
};

const fetchReviews = async () => {
  if (isDatabaseDown()) return [...state.reviews];
  try {
    const result = await pool.request().query('SELECT id, tour_id, user_name, comment AS review, rating, images_json AS images, created_at FROM dbo.Reviews ORDER BY created_at DESC');
    return result.recordset.map((review) => ({ ...review, images: parseJsonField(review.images) || [] }));
  } catch (error) {
    if (!String(error.message).includes('images_json')) throw error;
    const result = await pool.request().query('SELECT id, tour_id, user_name, comment AS review, rating, created_at FROM dbo.Reviews ORDER BY created_at DESC');
    return result.recordset.map((review) => ({ ...review, images: [] }));
  }
};

const fetchCategories = async () => {
  if (isDatabaseDown()) return [...state.categories];
  const result = await pool.request().query('SELECT id, name, slug, description FROM categories ORDER BY name');
  return result.recordset;
};

const fetchMemories = async () => {
  if (isDatabaseDown()) return [...state.memories];
  const result = await pool.request().query('SELECT id, title, image_url, summary, pinned, created_at FROM dbo.Memories ORDER BY created_at DESC');
  return result.recordset;
};

const fetchMapPins = async () => {
  if (isDatabaseDown()) return [...state.mapPins];
  try {
    const result = await pool.request().query('SELECT id, title AS name, latitude AS lat, longitude AS lng, day_number AS dayNumber, details AS description, photo_url, photo_url AS image_url, category FROM dbo.MapPins ORDER BY id');
    return result.recordset;
  } catch (error) {
    if (!String(error.message).includes('photo_url')) throw error;
    const result = await pool.request().query('SELECT id, title AS name, latitude AS lat, longitude AS lng, day_number AS dayNumber, details AS description, category FROM dbo.MapPins ORDER BY id');
    return result.recordset.map((pin) => ({ ...pin, photo_url: '', image_url: '' }));
  }
};

const fetchInquiries = async () => {
  if (isDatabaseDown()) return [...state.inquiries];
  const result = await pool.request().query(`SELECT id, user_id, user_name AS name, user_email AS email, route_json, stops_json,
    status, COALESCE(admin_notes, notes) AS notes, COALESCE(admin_notes, notes) AS admin_notes, created_at FROM dbo.RouteInquiries ORDER BY created_at DESC`);
  return result.recordset.map((inquiry) => ({
    ...inquiry,
    route: parseJsonField(inquiry.route_json) || [],
    stops: parseJsonField(inquiry.stops_json) || [],
  }));
};

const updateRouteInquiry = async (id, status, adminNotes) => {
  const normalizedStatus = status || 'Pending';
  const normalizedNotes = adminNotes || '';
  if (isDatabaseDown()) {
    const inquiry = state.inquiries.find((item) => item.id === Number(id));
    if (!inquiry) return null;
    inquiry.status = normalizedStatus;
    inquiry.notes = normalizedNotes;
    inquiry.admin_notes = normalizedNotes;
    const routeText = Array.isArray(inquiry.route) ? inquiry.route.join(' -> ') : 'your selected route';
    state.notifications.push({ id: getNextId(state.notifications), user_id: inquiry.user_id, message: `Your route request (${routeText}) has been updated to status: ${normalizedStatus}. Note from Admin: ${normalizedNotes || 'No additional note.'}`, created_at: new Date().toISOString(), read: false });
    return inquiry;
  }
  const result = await pool.request()
    .input('id', sql.Int, Number(id))
    .input('status', sql.NVarChar(50), normalizedStatus)
    .input('admin_notes', sql.NVarChar(sql.MAX), normalizedNotes)
    .query(`UPDATE dbo.RouteInquiries SET status=@status, admin_notes=@admin_notes, notes=@admin_notes WHERE id=@id;
      SELECT id, user_id, user_name AS name, user_email AS email, route_json, stops_json, status, admin_notes, created_at FROM dbo.RouteInquiries WHERE id=@id`);
  if (!result.recordset.length) return null;
  const inquiry = result.recordset[0];
  const route = parseJsonField(inquiry.route_json) || [];
  const routeText = Array.isArray(route) ? route.join(' -> ') : 'your selected route';
  await pool.request()
    .input('user_id', sql.Int, inquiry.user_id)
    .input('message', sql.NVarChar(500), `Your route request (${routeText}) has been updated to status: ${normalizedStatus}. Note from Admin: ${normalizedNotes || 'No additional note.'}`)
    .query('INSERT INTO dbo.Notifications (user_id, message) VALUES (@user_id, @message)');
  return { ...inquiry, route, stops: parseJsonField(inquiry.stops_json) || [], notes: inquiry.admin_notes };
};

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, phone, role = 'user' } = req.body;

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ message: 'Name, email, password, and contact number are required' });
  }

  try {
    if (isDatabaseDown()) {
      const existingUser = state.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        return res.status(409).json({ message: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        id: getNextId(state.users),
        name,
        email,
        phone,
        password: hashedPassword,
        role,
      };
      state.users.push(newUser);

      const token = generateToken({ id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name });
      return res.status(201).json({ token, user: normalizeUser(newUser) });
    }

    const existingResult = await pool.request()
      .input('email', sql.NVarChar(150), email)
      .input('phone', sql.NVarChar(30), phone)
      .query('SELECT TOP 1 * FROM dbo.Users WHERE email = @email');

    if (existingResult.recordset.length) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.request()
      .input('name', sql.NVarChar(100), name)
      .input('email', sql.NVarChar(150), email)
      .input('phone', sql.NVarChar(30), phone)
      .input('password', sql.NVarChar(255), hashedPassword)
      .input('role', sql.NVarChar(50), role)
      .query(`
        INSERT INTO dbo.Users (name, email, phone, password, role)
        OUTPUT INSERTED.*
        VALUES (@name, @email, @phone, @password, @role)
      `);

    const createdUser = result.recordset[0];
    const token = generateToken({ id: createdUser.id, email: createdUser.email, role: createdUser.role, name: createdUser.name });
    return res.status(201).json({ token, user: normalizeUser(createdUser) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to register user', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    if (isDatabaseDown()) {
      const user = state.users.find((item) => item.email.toLowerCase() === email.toLowerCase());
      if (!user) return res.status(401).json({ message: 'Invalid email or password' });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ message: 'Invalid email or password' });

      const token = generateToken({ id: user.id, email: user.email, role: user.role, name: user.name });
      return res.json({ token, user: normalizeUser(user) });
    }

    const result = await pool.request()
      .input('email', sql.NVarChar(150), email)
      .query('SELECT TOP 1 * FROM dbo.Users WHERE email = @email');

    const user = result.recordset[0];
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' });

    const token = generateToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    return res.json({ token, user: normalizeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  const user = isDatabaseDown()
    ? state.users.find((item) => item.email.toLowerCase() === email.toLowerCase())
    : null;

  if (!user) {
    return res.status(200).json({ message: 'If the email exists, a reset link has been sent.' });
  }

  return res.status(200).json({
    message: 'If the email exists, a reset link has been sent.',
    resetToken: generateToken({ id: user.id, email: user.email, role: user.role }),
  });
});

app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    if (isDatabaseDown()) {
      const user = state.users.find((item) => item.id === req.user.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      return res.json(normalizeUser(user));
    }

    const result = await pool.request()
      .input('id', sql.Int, req.user.id)
      .query('SELECT * FROM dbo.Users WHERE id = @id');

    if (!result.recordset[0]) return res.status(404).json({ message: 'User not found' });
    return res.json(normalizeUser(result.recordset[0]));
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load user profile', error: error.message });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    res.json(await fetchCategories());
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
  }
});

app.post('/api/categories', authenticateToken, requireRole('admin'), async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Category name is required' });

  const slug = String(name).trim().toLowerCase().replace(/\s+/g, '-');
  const newCategory = { id: getNextId(state.categories), name, slug, description: description || '' };
  state.categories.push(newCategory);
  return res.status(201).json(newCategory);
});

app.delete('/api/categories/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  state.categories = state.categories.filter((item) => item.id !== Number(id));
  res.json({ message: 'Category removed' });
});

app.get('/api/memories', async (req, res) => {
  try {
    res.json(await fetchMemories());
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch memories', error: error.message });
  }
});

app.post('/api/memories', authenticateToken, requireRole('admin'), async (req, res) => {
  const { title, summary, pinned = false } = req.body;
  const image_url = await compressImageToWebp(req.body.image_url || req.body.image);
  if (!title || !image_url) return res.status(400).json({ message: 'Title and image are required' });

  if (!isDatabaseDown()) {
    try {
      const result = await pool.request()
        .input('title', sql.NVarChar(200), title)
        .input('image_url', sql.NVarChar(sql.MAX), image_url)
        .input('summary', sql.NVarChar(sql.MAX), summary || '')
        .input('pinned', sql.Bit, Boolean(pinned))
        .query(`INSERT INTO dbo.Memories (title, image_url, summary, pinned)
          OUTPUT INSERTED.* VALUES (@title, @image_url, @summary, @pinned)`);
      return res.status(201).json(result.recordset[0]);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to create memory', error: error.message });
    }
  }

  const newMemory = {
    id: getNextId(state.memories),
    title,
    image_url,
    summary: summary || '',
    pinned: Boolean(pinned),
  };
  state.memories.push(newMemory);
  return res.status(201).json(newMemory);
});

app.delete('/api/memories/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid memory id' });
  if (isDatabaseDown()) {
    state.memories = state.memories.filter((memory) => memory.id !== id);
    return res.json({ message: 'Memory deleted successfully' });
  }
  try {
    const result = await pool.request().input('id', sql.Int, id).query('DELETE FROM dbo.Memories WHERE id = @id');
    if (!result.rowsAffected[0]) return res.status(404).json({ message: 'Memory not found' });
    return res.json({ message: 'Memory deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete memory', error: error.message });
  }
});

app.put('/api/memories/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid memory id' });
  const { title, summary, pinned = false } = req.body;
  const image_url = await compressImageToWebp(req.body.image_url || req.body.image);
  if (!title || !image_url) return res.status(400).json({ message: 'Title and image are required' });
  if (isDatabaseDown()) {
    const index = state.memories.findIndex((memory) => memory.id === id);
    if (index === -1) return res.status(404).json({ message: 'Memory not found' });
    state.memories[index] = { ...state.memories[index], title, image_url, summary: summary || '', pinned: Boolean(pinned) };
    return res.json(state.memories[index]);
  }
  try {
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('title', sql.NVarChar(200), title)
      .input('image_url', sql.NVarChar(sql.MAX), image_url)
      .input('summary', sql.NVarChar(sql.MAX), summary || '')
      .input('pinned', sql.Bit, Boolean(pinned))
      .query(`UPDATE dbo.Memories SET title=@title, image_url=@image_url, summary=@summary, pinned=@pinned WHERE id=@id`);
    if (!result.rowsAffected[0]) return res.status(404).json({ message: 'Memory not found' });
    return res.json({ id, title, image_url, summary: summary || '', pinned: Boolean(pinned) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update memory', error: error.message });
  }
});

app.get('/api/map-pins', async (req, res) => {
  try {
    res.json(await fetchMapPins());
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch map pins', error: error.message });
  }
});

app.get('/api/mappins', async (req, res) => {
  try {
    res.json(await fetchMapPins());
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch map pins', error: error.message });
  }
});

app.post('/api/map-pins', authenticateToken, requireRole('admin'), async (req, res) => {
  const { title, name, latitude, lat, longitude, lng, details, description, day_number, dayNumber, category, image_url, photo_url } = req.body;
  const finalTitle = title || name;
  const finalLat = parseFloat(latitude || lat);
  const finalLng = parseFloat(longitude || lng);
  const finalDetails = details || description;
  const finalDayNumber = parseInt(day_number || dayNumber, 10) || 1;
  const finalImageUrl = await compressImageToWebp(image_url || photo_url);
  console.log("EXACT SQL INPUT [MapPin POST]:", { finalTitle, finalLat, finalLng, finalDetails, finalDayNumber });
  if (!finalTitle || !Number.isFinite(finalLat) || !Number.isFinite(finalLng) || finalLat === 0 || finalLng === 0) {
    return res.status(400).json({ message: 'Title and valid non-zero coordinates are required' });
  }

  if (!isDatabaseDown()) {
    try {
      const result = await pool.request()
        .input('title', sql.NVarChar(200), finalTitle)
        .input('latitude', sql.Decimal(10, 7), finalLat)
        .input('longitude', sql.Decimal(10, 7), finalLng)
        .input('day_number', sql.Int, finalDayNumber)
        .input('details', sql.NVarChar(sql.MAX), finalDetails || '')
        .input('image_url', sql.VarChar(sql.MAX), finalImageUrl || '')
        .input('category', sql.NVarChar(100), category || null)
        .query(`INSERT INTO dbo.MapPins (title, latitude, longitude, day_number, details, photo_url, category)
          OUTPUT INSERTED.id, INSERTED.title AS name, INSERTED.latitude AS lat, INSERTED.longitude AS lng,
          INSERTED.day_number AS dayNumber, INSERTED.details AS description, INSERTED.photo_url, INSERTED.category
          VALUES (@title, @latitude, @longitude, @day_number, @details, @image_url, @category)`);
      return res.status(201).json(result.recordset[0]);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to create map pin', error: error.message });
    }
  }

  const newPin = {
    id: getNextId(state.mapPins),
    name: finalTitle,
    title: finalTitle,
    lat: finalLat,
    lng: finalLng,
    latitude: finalLat,
    longitude: finalLng,
    description: finalDetails || '',
    details: finalDetails || '',
    image_url: finalImageUrl || '',
    photo_url: finalImageUrl || '',
    dayNumber: finalDayNumber,
    day_number: finalDayNumber,
  };
  state.mapPins.push(newPin);
  return res.status(201).json(newPin);
});

app.post('/api/mappins', authenticateToken, requireRole('admin'), async (req, res) => {
  req.url = '/api/map-pins';
  return app._router.handle(req, res);
});

app.put('/api/mappins/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid map pin id' });
  const { title, name, latitude, lat, longitude, lng, details, description, day_number, dayNumber, category, image_url, photo_url } = req.body;
  const finalTitle = title || name;
  const finalLat = parseFloat(latitude || lat);
  const finalLng = parseFloat(longitude || lng);
  const finalDetails = details || description;
  const finalDayNumber = parseInt(day_number || dayNumber, 10) || 1;
  const finalImageUrl = await compressImageToWebp(image_url || photo_url || req.body.image);
  console.log("EXACT SQL INPUT [MapPin PUT]:", { finalTitle, finalLat, finalLng, finalDetails, finalDayNumber });
  if (!finalTitle || !Number.isFinite(finalLat) || !Number.isFinite(finalLng) || finalLat === 0 || finalLng === 0) {
    return res.status(400).json({ message: 'Title and valid non-zero coordinates are required' });
  }
  if (isDatabaseDown()) {
    const index = state.mapPins.findIndex((pin) => pin.id === id);
    if (index === -1) return res.status(404).json({ message: 'Map pin not found' });
    state.mapPins[index] = { ...state.mapPins[index], name: finalTitle, title: finalTitle, lat: finalLat, lng: finalLng, latitude: finalLat, longitude: finalLng, description: finalDetails || '', details: finalDetails || '', dayNumber: finalDayNumber, day_number: finalDayNumber, category };
    return res.json(state.mapPins[index]);
  }
  try {
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('title', sql.NVarChar(200), finalTitle)
      .input('latitude', sql.Decimal(10, 7), finalLat)
      .input('longitude', sql.Decimal(10, 7), finalLng)
      .input('day_number', sql.Int, finalDayNumber)
      .input('details', sql.NVarChar(sql.MAX), finalDetails || '')
      .input('image_url', sql.VarChar(sql.MAX), finalImageUrl || '')
      .input('category', sql.NVarChar(100), category || null)
      .query(`UPDATE dbo.MapPins SET title=@title, latitude=@latitude, longitude=@longitude,
        day_number=@day_number, details=@details, photo_url=@image_url, category=@category WHERE id=@id`);
    if (!result.rowsAffected[0]) return res.status(404).json({ message: 'Map pin not found' });
    return res.json({ id, name: finalTitle, title: finalTitle, lat: finalLat, lng: finalLng, latitude: finalLat, longitude: finalLng, dayNumber: finalDayNumber, day_number: finalDayNumber, description: finalDetails || '', details: finalDetails || '', image_url: finalImageUrl || '', photo_url: finalImageUrl || '', category });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update map pin', error: error.message });
  }
});

app.delete('/api/mappins/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid map pin id' });
  if (isDatabaseDown()) {
    const originalLength = state.mapPins.length;
    state.mapPins = state.mapPins.filter((pin) => pin.id !== id);
    if (state.mapPins.length === originalLength) return res.status(404).json({ message: 'Map pin not found' });
    return res.json({ message: 'Map pin deleted successfully' });
  }
  try {
    const result = await pool.request().input('id', sql.Int, id).query('DELETE FROM dbo.MapPins WHERE id = @id');
    if (!result.rowsAffected[0]) return res.status(404).json({ message: 'Map pin not found' });
    return res.json({ message: 'Map pin deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete map pin', error: error.message });
  }
});

app.get('/api/admin/inquiries', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    res.json(await fetchInquiries());
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load inquiries', error: error.message });
  }
});

app.post('/api/custom-route-inquiries', authenticateToken, async (req, res) => {
  const name = req.user.name || req.body.name || '';
  const email = req.user.email || req.body.email || '';
  const { travelers, route, stops, notes } = req.body;
  if (!name || !email || !Array.isArray(route) || route.length === 0) {
    return res.status(400).json({ message: 'Name, email and route are required' });
  }

  if (!isDatabaseDown()) {
    try {
      const result = await pool.request()
        .input('user_id', sql.Int, req.user.id)
        .input('user_name', sql.NVarChar(100), name)
        .input('user_email', sql.NVarChar(150), email)
        .input('route_json', sql.NVarChar(sql.MAX), JSON.stringify(route))
        .input('stops_json', sql.NVarChar(sql.MAX), JSON.stringify(Array.isArray(stops) ? stops : []))
        .input('travelers', sql.Int, Number(travelers) || 1)
        .input('notes', sql.NVarChar(sql.MAX), notes || '')
        .query(`INSERT INTO dbo.RouteInquiries (user_id, user_name, user_email, route_json, stops_json, travelers, notes)
          OUTPUT INSERTED.id, INSERTED.user_name AS name, INSERTED.user_email AS email, INSERTED.route_json,
          INSERTED.stops_json, INSERTED.travelers, INSERTED.status, INSERTED.notes, INSERTED.created_at
          VALUES (@user_id, @user_name, @user_email, @route_json, @stops_json, @travelers, @notes)`);
      const inquiry = result.recordset[0];
      return res.status(201).json({ ...inquiry, route: parseJsonField(inquiry.route_json), stops: parseJsonField(inquiry.stops_json) });
    } catch (error) {
      console.error('Route inquiry persistence failed:', error.message);
    }
  }

  const inquiry = {
    id: getNextId(state.inquiries),
    name,
    email,
    user_id: req.user.id,
    type: 'custom-route',
    status: 'Pending',
    travelers: Number(travelers || 1),
    route,
    stops: Array.isArray(stops) ? stops : [],
    notes: notes || '',
    created_at: new Date().toISOString(),
  };
  state.inquiries.unshift(inquiry);
  return res.status(201).json(inquiry);
});

app.patch('/api/admin/inquiries/:id/status', authenticateToken, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const valid = ['Pending', 'Contacted', 'Negotiating', 'Confirmed', 'Cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid inquiry status' });

  const inquiry = await updateRouteInquiry(id, status, req.body.admin_notes || req.body.notes || '');
  if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
  return res.json(inquiry);
});

app.patch('/api/custom-route-inquiries/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const inquiry = await updateRouteInquiry(req.params.id, req.body.status, req.body.admin_notes ?? req.body.notes);
  if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
  return res.json(inquiry);
});

app.put('/api/custom-route-inquiries/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const inquiry = await updateRouteInquiry(req.params.id, req.body.status, req.body.admin_notes ?? req.body.notes);
  if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
  return res.json(inquiry);
});

app.get('/api/notifications/my', authenticateToken, async (req, res) => {
  if (isDatabaseDown()) return res.json(state.notifications.filter((notification) => notification.user_id === req.user.id));
  const result = await pool.request().input('user_id', sql.Int, req.user.id)
    .query('SELECT id, message, created_at, is_read AS read FROM dbo.Notifications WHERE user_id=@user_id ORDER BY created_at DESC');
  return res.json(result.recordset);
});

app.get('/api/notifications/user/:userId', authenticateToken, async (req, res) => {
  if (Number(req.params.userId) !== Number(req.user.id) && req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  if (isDatabaseDown()) return res.json(state.notifications.filter((notification) => notification.user_id === Number(req.params.userId)));
  const result = await pool.request().input('user_id', sql.Int, Number(req.params.userId))
    .query('SELECT id, message, created_at, is_read AS read FROM dbo.Notifications WHERE user_id=@user_id ORDER BY created_at DESC');
  return res.json(result.recordset);
});

app.patch('/api/admin/inquiries/:id/notes', authenticateToken, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const inquiry = await updateRouteInquiry(id, req.body.status, req.body.admin_notes ?? req.body.notes);
  if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
  return res.json(inquiry);
});

app.get('/api/tours', async (req, res) => {
  try {
    const tours = await fetchTours();
    res.json(tours);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch tours', error: error.message });
  }
});

app.get('/api/tours/search', async (req, res) => {
  const { destination, category, minPrice, maxPrice, duration } = req.query;
  const items = await fetchTours();

  const filtered = items.filter((tour) => {
    const matchesDestination = !destination || (tour.destination || '').toLowerCase().includes(String(destination).toLowerCase());
    const matchesCategory = !category || (tour.category || '').toLowerCase().includes(String(category).toLowerCase());
    const matchesMinPrice = !minPrice || Number(tour.price) >= Number(minPrice);
    const matchesMaxPrice = !maxPrice || Number(tour.price) <= Number(maxPrice);
    const matchesDuration = !duration || (tour.duration || '').toLowerCase().includes(String(duration).toLowerCase());
    return matchesDestination && matchesCategory && matchesMinPrice && matchesMaxPrice && matchesDuration;
  });

  res.json(filtered);
});

app.post('/api/tours', authenticateToken, requireRole('admin'), async (req, res) => {
  const tourTitle = String(req.body.title || req.body.name || '').trim();
  const tourPrice = Number(req.body.price);
  const tourDuration = String(req.body.duration || 'Flexible').trim();
  const tourDescription = String(req.body.description || '').trim();
  const tourCategory = String(req.body.category || 'General').trim();
  const tourLocation = String(req.body.location || req.body.destination || '').trim();
  const tourImages = req.body.images ?? req.body.image_url;
  const tourHighlights = req.body.highlights ?? req.body.itinerary;
  const tourAvailability = req.body.availability || 'Available';
  const storedTourImages = await compressImageValue(tourImages);
  const parsedPayload = { title: tourTitle, price: tourPrice, duration: tourDuration, description: tourDescription, category: tourCategory, location: tourLocation, images: tourImages, highlights: tourHighlights };
  console.log("EXACT SQL INPUT [Tour POST]:", parsedPayload);
  if (!tourTitle) return res.status(400).json({ error: 'Invalid title' });
  if (!Number.isFinite(tourPrice)) return res.status(400).json({ error: 'Invalid price number' });
  if (!tourDuration) return res.status(400).json({ error: 'Invalid duration' });
  if (!tourCategory) return res.status(400).json({ error: 'Invalid category' });

  try {
    if (isDatabaseDown()) {
      const newTour = {
        id: getNextId(state.tours),
        title: tourTitle,
        price: tourPrice,
        duration: tourDuration,
        description: tourDescription,
        category: tourCategory,
        destination: tourLocation,
        image_url: serializeJsonField(storedTourImages),
        availability: tourAvailability,
        itinerary: serializeJsonField(tourHighlights),
      };
      state.tours.push(newTour);
      return res.status(201).json(newTour);
    }

    const result = await pool.request()
      .input('title', sql.NVarChar(200), tourTitle)
      .input('price', sql.Decimal(10, 2), tourPrice)
      .input('duration', sql.NVarChar(50), tourDuration)
      .input('description', sql.NVarChar(sql.MAX), tourDescription)
      .input('category', sql.NVarChar(100), tourCategory)
      .input('location', sql.NVarChar(150), tourLocation)
      .input('images_json', sql.NVarChar(sql.MAX), serializeJsonField(storedTourImages))
      .input('highlights', sql.NVarChar(sql.MAX), serializeJsonField(tourHighlights))
      .query(`
        INSERT INTO dbo.TourPackages (title, price, duration, description, category, location, images_json, highlights)
        OUTPUT INSERTED.*
        VALUES (@title, @price, @duration, @description, @category, @location, @images_json, @highlights)
      `);

    return res.status(201).json(result.recordset[0]);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create tour', error: error.message });
  }
});

app.put('/api/tours/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  if (!Number.isInteger(Number(id))) return res.status(400).json({ message: 'Invalid tour id' });
  const tourTitle = String(req.body.title || req.body.name || '').trim();
  const tourPrice = Number(req.body.price);
  const tourDuration = String(req.body.duration || 'Flexible').trim();
  const tourDescription = String(req.body.description || '').trim();
  const tourCategory = String(req.body.category || 'General').trim();
  const tourLocation = String(req.body.location || req.body.destination || '').trim();
  const tourImages = req.body.images ?? req.body.image_url;
  const tourHighlights = req.body.highlights ?? req.body.itinerary;
  const tourAvailability = req.body.availability || 'Available';
  const storedTourImages = await compressImageValue(tourImages);
  const parsedPayload = { title: tourTitle, price: tourPrice, duration: tourDuration, description: tourDescription, category: tourCategory, location: tourLocation, images: tourImages, highlights: tourHighlights };
  console.log("EXACT SQL INPUT [Tour PUT]:", parsedPayload);
  if (!tourTitle) return res.status(400).json({ error: 'Invalid title' });
  if (!Number.isFinite(tourPrice)) return res.status(400).json({ error: 'Invalid price number' });
  if (!tourDuration) return res.status(400).json({ error: 'Invalid duration' });
  if (!tourCategory) return res.status(400).json({ error: 'Invalid category' });

  if (isDatabaseDown()) {
    const index = state.tours.findIndex((tour) => tour.id === Number(id));
    if (index === -1) return res.status(404).json({ message: 'Tour not found' });

    state.tours[index] = { ...state.tours[index], title: tourTitle, price: tourPrice, duration: tourDuration, description: tourDescription || '', category: tourCategory, destination: tourLocation || '', image_url: serializeJsonField(storedTourImages), availability: tourAvailability, itinerary: serializeJsonField(tourHighlights) };
    return res.json(state.tours[index]);
  }

  try {
    const result = await pool.request()
      .input('id', sql.Int, Number(id))
      .input('title', sql.NVarChar(200), tourTitle)
      .input('price', sql.Decimal(10, 2), tourPrice)
      .input('duration', sql.NVarChar(50), tourDuration)
      .input('description', sql.NVarChar(sql.MAX), tourDescription || '')
      .input('category', sql.NVarChar(100), tourCategory)
      .input('location', sql.NVarChar(150), tourLocation || '')
      .input('images_json', sql.NVarChar(sql.MAX), serializeJsonField(storedTourImages))
      .input('highlights', sql.NVarChar(sql.MAX), serializeJsonField(tourHighlights))
      .query(`
        UPDATE dbo.TourPackages
        SET title = @title, price = @price, duration = @duration, description = @description,
          category = @category, location = @location, images_json = @images_json, highlights = @highlights
        WHERE id = @id;
        SELECT id, title, price, duration, description, category, location,
          images_json, highlights FROM dbo.TourPackages WHERE id = @id;
      `);
    if (!result.recordset.length) return res.status(404).json({ message: 'Tour not found' });
    return res.json(result.recordset[0]);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update tour', error: error.message });
  }
});

app.delete('/api/tours/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  if (!Number.isInteger(Number(id))) return res.status(400).json({ message: 'Invalid tour id' });

  if (isDatabaseDown()) {
    state.tours = state.tours.filter((tour) => tour.id !== Number(id));
    return res.json({ message: 'Tour deleted successfully' });
  }

  try {
    await pool.request()
      .input('id', sql.Int, Number(id))
      .query('DELETE FROM dbo.TourPackages WHERE id = @id');
    return res.json({ message: 'Tour deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete tour', error: error.message });
  }
});

app.get('/api/destinations', async (req, res) => {
  try {
    const destinations = await fetchDestinations();
    res.json(destinations);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch destinations', error: error.message });
  }
});

app.post('/api/destinations', authenticateToken, requireRole('admin'), async (req, res) => {
  const name = String(req.body.name || req.body.title || '').trim();
  const description = String(req.body.description || '').trim();
  const image_url = String(req.body.image_url || req.body.image || '').trim();
  const destinationRegion = String(req.body.location || req.body.region || '').trim();
  const rating = parseFloat(req.body.rating) || 5;
  const storedImageUrl = await compressImageToWebp(image_url);
  const parsedPayload = { name, description, image_url, location: destinationRegion, rating };
  console.log("EXACT SQL INPUT [Destination POST]:", parsedPayload);
  if (!name) return res.status(400).json({ error: 'Invalid name' });
  if (!name) {
    console.error("DESTINATION REJECTED - MISSING NAME. BODY:", req.body);
    return res.status(400).json({ error: "Destination name/title is required." });
  }

  try {
    if (isDatabaseDown()) {
      const newDestination = {
        id: getNextId(state.destinations),
        name,
        description,
        image_url: storedImageUrl,
        location: destinationRegion,
        rating,
      };
      state.destinations.push(newDestination);
      return res.status(201).json(newDestination);
    }

    const result = await pool.request()
      .input('name', sql.NVarChar(150), name)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('image_url', sql.NVarChar(sql.MAX), storedImageUrl)
      .input('region', sql.NVarChar(150), destinationRegion)
      .input('rating', sql.Decimal(3, 2), rating)
      .query(`
        INSERT INTO dbo.Destinations (name, description, image_url, region, rating)
        OUTPUT INSERTED.*
        VALUES (@name, @description, @image_url, @region, @rating)
      `);

    return res.status(201).json(result.recordset[0]);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create destination', error: error.message });
  }
});

app.put('/api/destinations/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid destination id' });
  const name = String(req.body.name || req.body.title || '').trim();
  const region = String(req.body.location || req.body.region || '').trim();
  const description = String(req.body.description || '').trim();
  const image_url = String(req.body.image_url || req.body.image || '').trim();
  const rating = parseFloat(req.body.rating) || 5;
  const is_popular = Boolean(req.body.is_popular);
  const storedImageUrl = await compressImageToWebp(image_url);
  const parsedPayload = { name, description, image_url, location: region, rating };
  console.log("EXACT SQL INPUT [Destination PUT]:", parsedPayload);
  if (!name) return res.status(400).json({ error: 'Invalid name' });
  if (!name) return res.status(400).json({ error: "Destination name/title is required." });
  if (isDatabaseDown()) {
    const index = state.destinations.findIndex((item) => item.id === id);
    if (index === -1) return res.status(404).json({ message: 'Destination not found' });
    state.destinations[index] = { ...state.destinations[index], name, location: region, description, image_url: storedImageUrl, rating };
    return res.json(state.destinations[index]);
  }
  try {
    const result = await pool.request()
      .input('id', sql.Int, id).input('name', sql.NVarChar(150), name)
      .input('region', sql.NVarChar(150), region)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('image_url', sql.NVarChar(sql.MAX), storedImageUrl)
      .input('rating', sql.Decimal(3, 2), rating)
      .input('is_popular', sql.Bit, is_popular)
      .query(`UPDATE dbo.Destinations SET name=@name, region=@region, description=@description,
        image_url=@image_url, rating=@rating, is_popular=@is_popular WHERE id=@id`);
    if (!result.rowsAffected[0]) return res.status(404).json({ message: 'Destination not found' });
    return res.json({ id, name, location: region, description, image_url: storedImageUrl, rating, is_popular });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update destination', error: error.message });
  }
});

app.delete('/api/destinations/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid destination id' });
  if (isDatabaseDown()) {
    state.destinations = state.destinations.filter((item) => item.id !== id);
    return res.json({ message: 'Destination deleted successfully' });
  }
  try {
    const result = await pool.request().input('id', sql.Int, id).query('DELETE FROM dbo.Destinations WHERE id = @id');
    if (!result.rowsAffected[0]) return res.status(404).json({ message: 'Destination not found' });
    return res.json({ message: 'Destination deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete destination', error: error.message });
  }
});

app.get('/api/bookings', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const bookings = await fetchBookings();
    res.json(bookings);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
  }
});

app.get('/api/bookings/my', authenticateToken, async (req, res) => {
  const userEmail = req.user.email;
  const bookings = await fetchBookings();
  const userBookings = bookings
    .filter((booking) => booking.user_email === userEmail)
    .map((booking) => ({
      ...booking,
      status: booking.status || 'pending',
      payment_status: booking.payment_status || 'pending',
      payment_method: booking.payment_method || 'credit-card',
      guests: Number(booking.guests || 1),
      total_amount: Number(booking.total_amount || booking.amount || 0),
      booking_reference: booking.booking_reference || `CP-${booking.id}`,
    }));
  res.json(userBookings);
});

app.post('/api/bookings', authenticateToken, async (req, res) => {
  const { user_name, user_email, tour_id, date, notes, guests, payment_method, payment_status, total_amount } = req.body;
  if (!user_name || !user_email || !tour_id || !date) {
    return res.status(400).json({ message: 'Please provide user_name, user_email, tour_id, and date' });
  }

  try {
    if (isDatabaseDown()) {
      const tour = state.tours.find((item) => item.id === Number(tour_id));
      const bookingReference = `CP-${Date.now().toString().slice(-6)}`;
      const newBooking = {
        id: getNextId(state.bookings),
        user_name,
        user_email,
        tour_id: Number(tour_id),
        tour_title: tour?.title || `Tour #${tour_id}`,
        date,
        status: 'pending',
        payment_status: payment_status || 'pending',
        payment_method: payment_method || 'credit-card',
        guests: Number(guests || 1),
        total_amount: Number(total_amount || (tour ? Number(tour.price) * Number(guests || 1) : 0)),
        booking_reference: bookingReference,
        notes: notes || '',
      };
      state.bookings.push(newBooking);
      return res.status(201).json({ message: 'Booking inquiry submitted successfully', booking: newBooking });
    }

    const result = await pool.request()
      .input('user_name', sql.NVarChar(100), user_name)
      .input('user_email', sql.NVarChar(150), user_email)
      .input('tour_id', sql.Int, Number(tour_id))
      .input('booking_date', sql.Date, new Date(date))
      .input('notes', sql.NVarChar(sql.MAX), notes || '')
      .query(`
        INSERT INTO dbo.BookingInquiries (user_name, user_email, tour_id, booking_date, status, notes)
        OUTPUT INSERTED.*
        VALUES (@user_name, @user_email, @tour_id, @booking_date, 'pending', @notes)
      `);

    return res.status(201).json({ message: 'Booking inquiry submitted successfully', booking: result.recordset[0] });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to submit booking inquiry', error: error.message });
  }
});

app.patch('/api/bookings/:id/cancel', authenticateToken, async (req, res) => {
  const { id } = req.params;

  if (isDatabaseDown()) {
    const index = state.bookings.findIndex((booking) => booking.id === Number(id));
    if (index === -1) return res.status(404).json({ message: 'Booking not found' });
    state.bookings[index].status = 'cancelled';
    state.bookings[index].payment_status = 'cancelled';
    return res.json(state.bookings[index]);
  }

  try {
    const result = await pool.request()
      .input('id', sql.Int, Number(id))
      .query("UPDATE dbo.BookingInquiries SET status = 'cancelled' WHERE id = @id");
    return res.json({ success: true, rowsAffected: result.rowsAffected[0] });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to cancel booking', error: error.message });
  }
});

app.patch('/api/bookings/:id/status', authenticateToken, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid booking status' });
  }

  if (isDatabaseDown()) {
    const index = state.bookings.findIndex((booking) => booking.id === Number(id));
    if (index === -1) return res.status(404).json({ message: 'Booking not found' });
    state.bookings[index].status = status;
    return res.json(state.bookings[index]);
  }

  try {
    const result = await pool.request()
      .input('id', sql.Int, Number(id))
      .input('status', sql.NVarChar(50), status)
      .query('UPDATE dbo.BookingInquiries SET status = @status WHERE id = @id');

    return res.json({ success: true, rowsAffected: result.rowsAffected[0] });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update booking status', error: error.message });
  }
});

app.get('/api/admin/users', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const users = await fetchUsers();
    res.json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load users', error: error.message });
  }
});

app.patch('/api/admin/users/:id/role', authenticateToken, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ message: 'Role must be admin or user' });
  }

  if (isDatabaseDown()) {
    const user = state.users.find((item) => item.id === Number(id));
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.role = role;
    return res.json(normalizeUser(user));
  }

  try {
    const result = await pool.request()
      .input('id', sql.Int, Number(id))
      .input('role', sql.NVarChar(50), role)
      .query('UPDATE dbo.Users SET role = @role WHERE id = @id');

    return res.json({ success: true, rowsAffected: result.rowsAffected[0] });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update user role', error: error.message });
  }
});

app.get('/api/reviews', async (req, res) => {
  const reviews = await fetchReviews();
  res.json(reviews);
});

app.post('/api/reviews', authenticateToken, async (req, res) => {
  const tour_id = Number(req.body.tour_id || req.body.tourId);
  const rating = Number(req.body.rating) || 0;
  const review = req.body.review || req.body.comment || '';
  const images = req.body.images ?? req.body.photos ?? [];
  const parsedPayload = { tour_id, rating, review, images };
  console.log("EXACT SQL INPUT [Review POST]:", parsedPayload);

  if (!Number.isInteger(tour_id) || tour_id <= 0) return res.status(400).json({ error: 'Invalid tour_id number' });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: 'Invalid rating number' });
  if (!review.trim()) return res.status(400).json({ error: 'Invalid review text' });

  const sanitizedImages = Array.isArray(images) ? images.slice(0, 5) : [];
  const compressedImages = [];

  for (const image of sanitizedImages) {
    const compressed = await compressImageToWebp(image);
    if (compressed) compressedImages.push(compressed);
  }

  if (isDatabaseDown()) {
    const newReview = {
      id: getNextId(state.reviews),
      tour_id: Number(tour_id),
      user_name: req.user.name,
      rating,
      review,
      images: compressedImages,
    };
    state.reviews.push(newReview);
    return res.status(201).json(newReview);
  }

  try {
    const result = await pool.request()
      .input('tour_id', sql.Int, tour_id)
      .input('user_name', sql.NVarChar(100), req.user.name)
      .input('comment', sql.NVarChar(sql.MAX), review)
      .input('rating', sql.Int, rating)
      .input('images_json', sql.NVarChar(sql.MAX), serializeJsonField(compressedImages))
      .query(`INSERT INTO dbo.Reviews (tour_id, user_name, comment, rating, images_json)
        OUTPUT INSERTED.id, INSERTED.tour_id, INSERTED.user_name, INSERTED.comment AS review, INSERTED.rating, INSERTED.images_json AS images, INSERTED.created_at
        VALUES (@tour_id, @user_name, @comment, @rating, @images_json)`);
    return res.status(201).json({ ...result.recordset[0], images: compressedImages });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to submit review', error: error.message });
  }
});

app.delete('/api/reviews/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid review id' });
  if (isDatabaseDown()) {
    state.reviews = state.reviews.filter((review) => review.id !== id);
    return res.json({ message: 'Review deleted successfully' });
  }
  try {
    const result = await pool.request().input('id', sql.Int, id).query('DELETE FROM dbo.Reviews WHERE id = @id');
    if (!result.rowsAffected[0]) return res.status(404).json({ message: 'Review not found' });
    return res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete review', error: error.message });
  }
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

const server = app.listen(PORT, { maxHeaderSize: 65536 }, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

connectDB()
  .then(async () => {
    await pool.request().batch(`
      CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'customer', phone TEXT);
      CREATE TABLE IF NOT EXISTS destinations (id SERIAL PRIMARY KEY, name TEXT NOT NULL, description TEXT, image_url TEXT, region TEXT NOT NULL DEFAULT '', rating NUMERIC(3, 2) DEFAULT 5, is_popular BOOLEAN NOT NULL DEFAULT false);
      CREATE TABLE IF NOT EXISTS tourpackages (id SERIAL PRIMARY KEY, title TEXT NOT NULL, price NUMERIC(10, 2) NOT NULL, duration TEXT NOT NULL, description TEXT, category TEXT NOT NULL, location TEXT, images_json TEXT, highlights TEXT);
      CREATE TABLE IF NOT EXISTS bookinginquiries (id SERIAL PRIMARY KEY, user_name TEXT NOT NULL, user_email TEXT NOT NULL, tour_id INTEGER NOT NULL, booking_date DATE NOT NULL, status TEXT NOT NULL DEFAULT 'pending', notes TEXT);
      CREATE TABLE IF NOT EXISTS memories (id SERIAL PRIMARY KEY, title TEXT NOT NULL, image_url TEXT NOT NULL, summary TEXT, pinned BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS mappins (id SERIAL PRIMARY KEY, title TEXT NOT NULL, latitude NUMERIC(10, 7) NOT NULL, longitude NUMERIC(10, 7) NOT NULL, day_number INTEGER NOT NULL DEFAULT 1, details TEXT, photo_url TEXT, category TEXT);
      CREATE TABLE IF NOT EXISTS routeinquiries (id SERIAL PRIMARY KEY, user_id INTEGER, user_name TEXT NOT NULL, user_email TEXT NOT NULL, route_json TEXT NOT NULL, stops_json TEXT, travelers INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'Pending', notes TEXT, admin_notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS notifications (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, message TEXT NOT NULL, is_read BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS reviews (id SERIAL PRIMARY KEY, tour_id INTEGER NOT NULL, user_name TEXT NOT NULL, comment TEXT NOT NULL, rating INTEGER NOT NULL, images_json TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS categories (id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, slug TEXT NOT NULL UNIQUE, description TEXT);
    `);
    databaseReady = true;
    console.log('✅ Supabase PostgreSQL schema is ready');
  })
  .catch(() => {
    databaseReady = false;
    console.warn('⚠️ Supabase PostgreSQL unavailable. Continuing in demo mode with in-memory seed data.');
  });

server.on('error', (error) => {
  console.error('HTTP server error:', error);
});
