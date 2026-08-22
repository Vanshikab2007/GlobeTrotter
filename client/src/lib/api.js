const BASE = '/api';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: (token) => request('/auth/me', { token }),
  forgotPassword: (email) => request('/auth/forgot-password', { body: { email } }),
  resetPassword: (token, password) => request('/auth/reset-password', { body: { token, password } }),

  listTrips: (token) => request('/trips', { token }),
  createTrip: (token, payload) => request('/trips', { method: 'POST', body: payload, token }),
  getTrip: (token, id) => request(`/trips/${id}`, { token }),
  updateTrip: (token, id, payload) => request(`/trips/${id}`, { method: 'PUT', body: payload, token }),
  deleteTrip: (token, id) => request(`/trips/${id}`, { method: 'DELETE', token }),
  uploadTripCover: (token, id, base64Image) => request(`/trips/${id}/cover`, { method: 'POST', body: { image: base64Image }, token }),
  getBudget: (token, id) => request(`/trips/${id}/budget`, { token }),
  shareTrip: (token, id) => request(`/trips/${id}/share`, { method: 'POST', token }),

  addStop: (token, tripId, payload) => request(`/trips/${tripId}/stops`, { method: 'POST', body: payload, token }),
  updateStop: (token, tripId, stopId, payload) =>
    request(`/trips/${tripId}/stops/${stopId}`, { method: 'PUT', body: payload, token }),
  deleteStop: (token, tripId, stopId) =>
    request(`/trips/${tripId}/stops/${stopId}`, { method: 'DELETE', token }),

  addActivity: (token, tripId, stopId, payload) =>
    request(`/trips/${tripId}/stops/${stopId}/activities`, { method: 'POST', body: payload, token }),
  updateActivity: (token, tripId, stopId, activityId, payload) =>
    request(`/trips/${tripId}/stops/${stopId}/activities/${activityId}`, { method: 'PUT', body: payload, token }),
  deleteActivity: (token, tripId, stopId, activityId) =>
    request(`/trips/${tripId}/stops/${stopId}/activities/${activityId}`, { method: 'DELETE', token }),

  getAdminStats: (token) => request('/admin/stats', { token }),

  searchCities: (q) => request(`/cities${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  cityActivities: (cityId) => request(`/cities/${cityId}/activities`),

  getPublicTrip: (slug) => request(`/public/${slug}`),
  copySharedTrip: (token, slug) => request(`/public/${slug}/copy`, { method: 'POST', token }),
};
