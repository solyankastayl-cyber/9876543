/**
 * EPIC D1 — Signals API Client
 * 
 * API for D1 Engine Signals (structural alerts)
 */

const API_BASE = process.env.REACT_APP_BACKEND_URL;

/**
 * Get signals list with filters
 */
export async function getD1Signals(params = {}) {
  const {
    window = '7d',
    status,
    type,
    scope,
    severity,
    q,
    page = 1,
    limit = 12
  } = params;

  const queryParams = new URLSearchParams();
  queryParams.set('window', window);
  queryParams.set('page', String(page));
  queryParams.set('limit', String(limit));
  
  if (status) queryParams.set('status', Array.isArray(status) ? status.join(',') : status);
  if (type) queryParams.set('type', Array.isArray(type) ? type.join(',') : type);
  if (scope) queryParams.set('scope', Array.isArray(scope) ? scope.join(',') : scope);
  if (severity) queryParams.set('severity', Array.isArray(severity) ? severity.join(',') : severity);
  if (q) queryParams.set('q', q);

  const response = await fetch(`${API_BASE}/api/d1-signals?${queryParams}`);
  return response.json();
}

/**
 * Get signal by ID
 */
export async function getD1SignalById(id) {
  const response = await fetch(`${API_BASE}/api/d1-signals/${id}`);
  return response.json();
}

/**
 * Get signal stats summary
 */
export async function getD1SignalStats(window = '7d') {
  const response = await fetch(`${API_BASE}/api/d1-signals/stats/summary?window=${window}`);
  return response.json();
}

/**
 * Get facets for filters
 */
export async function getD1SignalFacets(window = '7d') {
  const response = await fetch(`${API_BASE}/api/d1-signals/facets?window=${window}`);
  return response.json();
}

/**
 * Archive a signal
 */
export async function archiveD1Signal(id) {
  const response = await fetch(`${API_BASE}/api/d1-signals/${id}/archive`, {
    method: 'POST'
  });
  return response.json();
}

/**
 * Seed sample signals (dev only)
 */
export async function seedD1Signals(count = 15, window = '7d') {
  const response = await fetch(`${API_BASE}/api/d1-signals/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count, window })
  });
  return response.json();
}

/**
 * Clear all signals (dev only)
 */
export async function clearD1Signals() {
  const response = await fetch(`${API_BASE}/api/d1-signals/clear`, {
    method: 'DELETE'
  });
  return response.json();
}

export const d1SignalsApi = {
  getSignals: getD1Signals,
  getSignalById: getD1SignalById,
  getStats: getD1SignalStats,
  getFacets: getD1SignalFacets,
  archive: archiveD1Signal,
  seed: seedD1Signals,
  clear: clearD1Signals
};

export default d1SignalsApi;
