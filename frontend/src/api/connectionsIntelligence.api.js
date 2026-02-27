import axios from 'axios';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

export async function explainEntity(entityId, preset) {
  const params = preset ? { preset } : {};
  const res = await axios.get(`${API_BASE}/api/connections/explain/${encodeURIComponent(entityId)}`, { params });
  return res.data;
}

export async function compareEntities(left, right, preset) {
  const res = await axios.post(`${API_BASE}/api/connections/compare/v2`, { left, right, preset });
  return res.data;
}

export async function getWatchlists() {
  const res = await axios.get(`${API_BASE}/api/connections/watchlists`);
  return res.data;
}

export async function createWatchlist(name, type) {
  const res = await axios.post(`${API_BASE}/api/connections/watchlists`, { name, type });
  return res.data;
}

export async function getWatchlistWithDiff(id) {
  const res = await axios.get(`${API_BASE}/api/connections/watchlists/${id}/diff`);
  return res.data;
}

export async function addToWatchlist(watchlistId, entityId, type, preset) {
  const res = await axios.post(`${API_BASE}/api/connections/watchlists/${watchlistId}/items`, {
    entityId, type, preset
  });
  return res.data;
}

export async function removeFromWatchlist(watchlistId, entityId) {
  const res = await axios.delete(`${API_BASE}/api/connections/watchlists/${watchlistId}/items/${entityId}`);
  return res.data;
}
