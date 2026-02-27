/**
 * Admin API Client
 * 
 * All admin endpoints with JWT authentication.
 */

const API_BASE = process.env.REACT_APP_BACKEND_URL;

// Token storage
let authToken = null;

export function setAdminToken(token) {
  authToken = token;
  if (token) {
    localStorage.setItem('admin_token', token);
  } else {
    localStorage.removeItem('admin_token');
  }
}

export function getAdminToken() {
  if (!authToken) {
    authToken = localStorage.getItem('admin_token');
  }
  return authToken;
}

export function clearAdminToken() {
  authToken = null;
  localStorage.removeItem('admin_token');
}

// Helper for authenticated requests
async function adminFetch(endpoint, options = {}) {
  const token = getAdminToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAdminToken();
    throw new Error('UNAUTHORIZED');
  }

  // Clone response before reading to avoid "body stream already read" error
  const responseClone = response.clone();
  
  let data;
  try {
    data = await response.json();
  } catch (e) {
    // If JSON parsing fails, try to get text
    const text = await responseClone.text();
    throw new Error(text || 'Invalid response');
  }
  
  if (!response.ok) {
    throw new Error(data.message || data.error || data.detail || 'Request failed');
  }
  
  return data;
}

// ============================================
// AUTH
// ============================================

export async function login(username, password) {
  const data = await adminFetch('/api/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  
  if (data.ok && data.token) {
    setAdminToken(data.token);
  }
  
  return data;
}

export async function checkAuthStatus() {
  return adminFetch('/api/admin/auth/status');
}

export async function listUsers() {
  return adminFetch('/api/admin/auth/users');
}

export async function createUser(username, password, role) {
  return adminFetch('/api/admin/auth/users', {
    method: 'POST',
    body: JSON.stringify({ username, password, role }),
  });
}

export function logout() {
  clearAdminToken();
}

// ============================================
// SYSTEM OVERVIEW (ЭТАП 1)
// ============================================

export async function getSystemOverview() {
  return adminFetch('/api/admin/system/overview');
}

export async function updateRuntime(config) {
  return adminFetch('/api/admin/system/runtime', {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

// ============================================
// DATA PIPELINES (ЭТАП 2)
// ============================================

export async function getPipelinesStatus() {
  return adminFetch('/api/admin/data/pipelines');
}

// ============================================
// HEALTH & DASHBOARD
// ============================================

export async function getHealth() {
  return adminFetch('/api/admin/health');
}

export async function getDashboard() {
  return adminFetch('/api/admin/dashboard');
}

// ============================================
// ML CONTROL
// ============================================

export async function getMLStatus() {
  return adminFetch('/api/admin/ml/status');
}

export async function toggleML(enabled) {
  return adminFetch('/api/admin/ml/toggle', {
    method: 'POST',
    body: JSON.stringify({ enabled }),
  });
}

export async function updateMLPolicy(policy) {
  return adminFetch('/api/admin/ml/policy', {
    method: 'POST',
    body: JSON.stringify(policy),
  });
}

export async function resetCircuitBreaker() {
  return adminFetch('/api/admin/ml/circuit-breaker/reset', {
    method: 'POST',
  });
}

export async function getMLModels() {
  return adminFetch('/api/admin/ml/models');
}

export async function toggleModel(model, enabled) {
  return adminFetch('/api/admin/ml/models/toggle', {
    method: 'POST',
    body: JSON.stringify({ model, enabled }),
  });
}

export async function reloadModels() {
  return adminFetch('/api/admin/ml/reload', {
    method: 'POST',
  });
}

// ============================================
// PROVIDERS
// ============================================

export async function getProvidersStatus() {
  return adminFetch('/api/admin/providers/status');
}

export async function resetAllProviders() {
  return adminFetch('/api/admin/providers/reset-all', {
    method: 'POST',
  });
}

export async function addProvider(config) {
  return adminFetch('/api/admin/providers/add', {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

export async function removeProvider(id) {
  return adminFetch(`/api/admin/providers/${id}`, {
    method: 'DELETE',
  });
}

// ============================================
// AUDIT LOG
// ============================================

export async function getAuditLog(limit = 50, action = null) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (action) params.set('action', action);
  return adminFetch(`/api/admin/audit-log?${params}`);
}

// ============================================
// INFERENCE LOGS
// ============================================

export async function getInferenceLogs(network = 'ethereum', limit = 50) {
  const params = new URLSearchParams({ network, limit: String(limit) });
  return adminFetch(`/api/admin/logs/inference?${params}`);
}

export default {
  // Auth
  login,
  logout,
  checkAuthStatus,
  listUsers,
  createUser,
  getAdminToken,
  setAdminToken,
  clearAdminToken,
  
  // Health
  getHealth,
  getDashboard,
  
  // ML
  getMLStatus,
  toggleML,
  updateMLPolicy,
  resetCircuitBreaker,
  getMLModels,
  toggleModel,
  reloadModels,
  
  // Providers
  getProvidersStatus,
  resetAllProviders,
  addProvider,
  removeProvider,
  
  // Logs
  getAuditLog,
  getInferenceLogs,
};
