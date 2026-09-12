import axios from 'axios';
import { authStorage, isAuthenticationRequest, isProtectedRoute } from '../auth';

const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
const API_BASE_URL = configuredApiUrl || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

const axiosClient = axios.create({ baseURL: API_BASE_URL });

axiosClient.interceptors.request.use((config) => {
  if (!isAuthenticationRequest(config.url) && !config.headers?.Authorization) {
    const token = authStorage.getToken();
    if (token) {
      config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
    }
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.response?.data?.error || '';

    const isExpiredToken = String(message).toLowerCase().includes('invalid or expired token');
    const isUnauthorized = status === 401 || (status === 403 && isExpiredToken);

    if (
      isUnauthorized &&
      !isAuthenticationRequest(error.config?.url) &&
      isProtectedRoute() &&
      authStorage.getToken()
    ) {
      localStorage.removeItem('ceylon_paradise_token');
      localStorage.removeItem('ceylon_paradise_user');
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') window.location.assign('/login');
    }

    return Promise.reject(error);
  }
);

async function request(path, options = {}) {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const body = isFormData || typeof options.body !== 'string'
    ? options.body
    : JSON.parse(options.body);

  try {
    const response = await axiosClient.request({
      url: path,
      method: options.method || 'GET',
      headers: options.headers,
      data: body,
    });
    return response.data;
  } catch (error) {
    const responseData = error.response?.data || {};
    const normalizedError = new Error(
      responseData.message || responseData.error || `Request failed: ${error.response?.status || 'network error'}`
    );
    normalizedError.response = error.response;
    throw normalizedError;
  }
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
