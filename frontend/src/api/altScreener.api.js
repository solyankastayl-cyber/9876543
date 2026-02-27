/**
 * Alt Screener API Client
 * ========================
 * API client for Alt Screener ML endpoints
 */

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

/**
 * Fetch ML-based alt screener predictions
 */
export async function fetchAltScreenerML({ horizon = '4h', limit = 30 } = {}) {
  const qs = new URLSearchParams({ horizon, limit: String(limit) }).toString();
  const res = await fetch(`${API_BASE}/api/exchange/screener/ml/predict?${qs}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(json?.error || `HTTP_${res.status}`);
    err.payload = json;
    throw err;
  }
  return json;
}

/**
 * Fetch pattern-based candidates
 */
export async function fetchAltCandidates({ horizon = '4h', limit = 20, fundingFilter } = {}) {
  const params = { horizon, limit: String(limit) };
  if (fundingFilter) params.fundingFilter = fundingFilter;
  
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/api/exchange/screener/candidates?${qs}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(json?.error || `HTTP_${res.status}`);
    err.payload = json;
    throw err;
  }
  return json;
}

/**
 * Fetch winner patterns
 */
export async function fetchWinners({ horizon, days = 7, limit = 30 } = {}) {
  const params = { days: String(days), limit: String(limit) };
  if (horizon) params.horizon = horizon;
  
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/api/exchange/screener/winners?${qs}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(json?.error || `HTTP_${res.status}`);
    err.payload = json;
    throw err;
  }
  return json;
}

/**
 * Fetch screener health
 */
export async function fetchScreenerHealth() {
  const res = await fetch(`${API_BASE}/api/exchange/screener/health`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(json?.error || `HTTP_${res.status}`);
    err.payload = json;
    throw err;
  }
  return json;
}

/**
 * Trigger ML training (admin)
 */
export async function triggerTraining({ horizon = '4h', daysBack = 30 } = {}) {
  const res = await fetch(`${API_BASE}/api/admin/exchange/screener/ml/train`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ horizon, daysBack }),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(json?.error || `HTTP_${res.status}`);
    err.payload = json;
    throw err;
  }
  return json;
}

console.log('[AltScreener API] Loaded');
