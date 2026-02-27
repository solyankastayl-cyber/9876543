/**
 * BLOCK L2 + L3 — Lifecycle API Client
 */

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// L2 — State & Events
export async function fetchLifecycleState() {
  const response = await fetch(`${API_BASE}/api/lifecycle/state`);
  if (!response.ok) throw new Error('Failed to fetch lifecycle state');
  return response.json();
}

export async function fetchLifecycleEvents(asset = null, limit = 100) {
  const params = new URLSearchParams();
  if (asset) params.set('asset', asset);
  if (limit) params.set('limit', limit.toString());
  
  const url = `${API_BASE}/api/lifecycle/events?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch lifecycle events');
  return response.json();
}

// L2 — Actions
export async function forceWarmup(asset, targetDays = 30) {
  const response = await fetch(`${API_BASE}/api/lifecycle/actions/force-warmup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ asset, targetDays }),
  });
  return response.json();
}

export async function forceApply(asset, reason) {
  const response = await fetch(`${API_BASE}/api/lifecycle/actions/force-apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ asset, reason }),
  });
  return response.json();
}

export async function revokeModel(asset, reason) {
  const response = await fetch(`${API_BASE}/api/lifecycle/actions/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ asset, reason }),
  });
  return response.json();
}

export async function resetSimulation(asset, reason) {
  const response = await fetch(`${API_BASE}/api/lifecycle/actions/reset-simulation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ asset, reason }),
  });
  return response.json();
}

export async function initializeLifecycle() {
  const response = await fetch(`${API_BASE}/api/lifecycle/init`, {
    method: 'POST',
  });
  return response.json();
}

// L3 — Constitution Binding
export async function applyConstitution(asset, hash) {
  const response = await fetch(`${API_BASE}/api/lifecycle/constitution/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ asset, hash }),
  });
  return response.json();
}

// L3 — Drift Update
export async function updateDrift(asset, severity, details = {}) {
  const response = await fetch(`${API_BASE}/api/lifecycle/drift/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ asset, severity, ...details }),
  });
  return response.json();
}

// L3 — Live Samples
export async function incrementLiveSamples(asset, count = 1) {
  const response = await fetch(`${API_BASE}/api/lifecycle/samples/increment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ asset, count }),
  });
  return response.json();
}

// L3 — Auto-Promotion Check
export async function checkPromotion(asset) {
  const response = await fetch(`${API_BASE}/api/lifecycle/check-promotion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ asset }),
  });
  return response.json();
}

// L3 — Integrity Check
export async function checkIntegrity(asset) {
  const response = await fetch(`${API_BASE}/api/lifecycle/integrity/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ asset }),
  });
  return response.json();
}
