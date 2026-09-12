import { fetchWithAuth } from './auth';

const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
export const API_BASE_URL = configuredApiUrl || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
const listCache = new Map();
const pendingLists = new Map();
const CACHE_TTL = 5000;

const parseImageValue = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return value ? [value] : [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
  } catch {
    return value ? [value] : [];
  }
};

export const getTourImage = (tour) => {
  const images = parseImageValue(tour?.image_url ?? tour?.images ?? tour?.image ?? tour?.photo);
  return images.find((image) => typeof image === 'string' && (image.startsWith('data:image/') || image.startsWith('http') || image.startsWith('/'))) || '';
};

export const getImageSource = (item) => {
  const value = item?.image_url || item?.photo_url || item?.photo || item?.image || '';
  const images = parseImageValue(value);
  return images.find((image) => typeof image === 'string' && (image.startsWith('data:image/') || image.startsWith('http') || image.startsWith('/'))) || '';
};

export const normalizeTour = (tour) => {
  if (!tour || typeof tour !== 'object') return {};
  const parse = (value) => {
    if (typeof value !== 'string') return value;
    try { return JSON.parse(value); } catch { return value; }
  };
  const images = parse(tour.images ?? tour.image_url);
  const highlights = parse(tour.highlights ?? tour.itinerary);
  return { ...tour, images: Array.isArray(images) ? images : images ? [images] : [], highlights: Array.isArray(highlights) ? highlights : highlights ? [highlights] : [], image_url: Array.isArray(images) ? images[0] || '' : images || '', itinerary: Array.isArray(highlights) ? highlights.join(', ') : highlights || '' };
};

export const normalizeTours = (tours) => (Array.isArray(tours) ? tours : []).map(normalizeTour);

const cachedList = async (path) => {
  const cached = listCache.get(path);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data;
  if (!pendingLists.has(path)) {
    pendingLists.set(path, fetchWithAuth(`${API_BASE_URL}${path}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to fetch ${path}`);
        return response.json();
      })
      .then((data) => {
        listCache.set(path, { data, timestamp: Date.now() });
        return data;
      })
      .finally(() => pendingLists.delete(path)));
  }
  return pendingLists.get(path);
};

export const api = {
  getTours: () => cachedList('/tours'),

  getDestinations: () => cachedList('/destinations'),

  getCategories: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  },

  getMemories: async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/memories`);
    if (!response.ok) throw new Error('Failed to fetch memories');
    return response.json();
  },

  getMapPins: () => cachedList('/mappins'),
  getAdminInquiries: async (token) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/admin/inquiries`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch inquiries');
    return response.json();
  },

  createMapPin: async (payload, token) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/mappins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create map pin');
    return data;
  },

  updateInquiryStatus: async (id, status, token) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/admin/inquiries/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update inquiry status');
    return data;
  },

  saveInquiryNotes: async (id, notes, token) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/admin/inquiries/${id}/notes`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ notes }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to save inquiry notes');
    return data;
  },

  submitBooking: async (payload) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit booking');
    }

    return data;
  },
};
