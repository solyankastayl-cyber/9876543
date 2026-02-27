// B4 - Twitter Parser API Client
// Works with Runtime Layer endpoints

const API_URL = process.env.REACT_APP_BACKEND_URL || '';
const BASE = `${API_URL}/api/v4/twitter`;

async function jsonFetch(url, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    // Don't use credentials for API calls to avoid CORS issues
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { ok: false, error: 'INVALID_JSON' };
  }

  if (!res.ok && data?.ok !== false) {
    return { ok: false, error: `HTTP_${res.status}` };
  }

  return data;
}

/**
 * Run search via Runtime Layer
 */
export async function runRuntimeSearch(params) {
  const { type, keyword, username, limit = 20, sort = 'latest' } = params;

  const payload = type === 'keyword'
    ? { keyword, limit }
    : { username, limit };

  const endpoint = type === 'keyword'
    ? `${BASE}/runtime/search`
    : `${BASE}/runtime/account/tweets`;

  return jsonFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Get execution detailed status
 */
export async function fetchExecutionDetailedStatus() {
  return jsonFetch(`${BASE}/execution/detailed-status`, {
    method: 'GET',
  });
}

/**
 * Get basic execution status
 */
export async function fetchExecutionStatus() {
  return jsonFetch(`${BASE}/execution/status`, {
    method: 'GET',
  });
}

/**
 * Start worker
 */
export async function startWorker() {
  return jsonFetch(`${BASE}/execution/worker/start`, {
    method: 'POST',
  });
}

/**
 * Stop worker
 */
export async function stopWorker() {
  return jsonFetch(`${BASE}/execution/worker/stop`, {
    method: 'POST',
  });
}
