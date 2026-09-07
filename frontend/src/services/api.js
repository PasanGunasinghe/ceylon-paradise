const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
const API_BASE_URL = configuredApiUrl || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    body: options.body,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || `Request failed: ${response.status}`);
    error.response = { status: response.status, data };
    throw error;
  }
  return data;
}

export const apiClient = {
  getTours: () => request('/tours'),
  createTour: (payload, token) => request('/tours', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) }),
  updateTour: (id, payload, token) => request(`/tours/${id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) }),
  deleteTour: (id, token) => request(`/tours/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
  getDestinations: () => request('/destinations'),
  createDestination: (payload, token) => request('/destinations', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) }),
  updateDestination: (id, payload, token) => request(`/destinations/${id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) }),
  deleteDestination: (id, token) => request(`/destinations/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
  getMapPins: () => request('/mappins'),
  submitCustomRoute: (payload, token) => request('/custom-route-inquiries', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) }),
  updateInquiryStatus: (id, status, token) => request(`/admin/inquiries/${id}/status`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) }),
  createMapPin: (payload, token) => request('/mappins', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) }),
  updateMapPin: (id, payload, token) => request(`/mappins/${id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) }),
  updateRouteInquiry: (id, payload, token) => request(`/custom-route-inquiries/${id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) }),
  deleteMapPin: (id, token) => request(`/mappins/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
  getBookings: (token) => request('/bookings', { headers: { Authorization: `Bearer ${token}` } }),
  changeAdminPassword: (payload, token) => request('/admin/change-password', { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) }),
  createBooking: (payload, token) => request('/bookings', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) }),
  getReviews: () => request('/reviews'),
  createMemory: (payload, token) => request('/memories', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) }),
  updateMemory: (id, payload, token) => request(`/memories/${id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) }),
  deleteMemory: (id, token) => request(`/memories/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
  deleteReview: (id, token) => request(`/reviews/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
};

export { API_BASE_URL };
