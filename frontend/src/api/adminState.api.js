/**
 * Admin State API - STEP 0.5
 * 
 * Быстрый слой: только текущее состояние, без агрегаций.
 */

import { api } from './client';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
});

/**
 * Fetch all admin state (FAST PATH)
 * Used on initial load - blocks render
 */
export async function fetchAdminState() {
  const res = await api.get('/api/admin/state/all', {
    headers: getAuthHeaders(),
  });
  if (!res.data.ok) throw new Error('STATE_LOAD_FAILED');
  return res.data.data;
}

/**
 * Fetch system state only
 */
export async function fetchSystemState() {
  const res = await api.get('/api/admin/state/system', {
    headers: getAuthHeaders(),
  });
  return res.data.data;
}

/**
 * Fetch ML state only
 */
export async function fetchMLState() {
  const res = await api.get('/api/admin/state/ml', {
    headers: getAuthHeaders(),
  });
  return res.data.data;
}

/**
 * Fetch providers state only
 */
export async function fetchProvidersState() {
  const res = await api.get('/api/admin/state/providers', {
    headers: getAuthHeaders(),
  });
  return res.data.data;
}

/**
 * Fetch retrain state only
 */
export async function fetchRetrainState() {
  const res = await api.get('/api/admin/state/retrain', {
    headers: getAuthHeaders(),
  });
  return res.data.data;
}
