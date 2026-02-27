/**
 * Admin Metrics API - STEP 0.5
 * 
 * Кэшированный слой: агрегированные метрики.
 * Загружаются асинхронно, не блокируют UI.
 */

import { api } from './client';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
});

/**
 * Fetch all metrics (SLOW PATH)
 * Used after initial render - non-blocking
 */
export async function fetchAdminMetrics() {
  const res = await api.get('/api/admin/metrics/all', {
    headers: getAuthHeaders(),
  });
  if (!res.data.ok) throw new Error('METRICS_LOAD_FAILED');
  return res.data.data;
}

/**
 * Fetch accuracy metrics
 */
export async function fetchAccuracyMetrics() {
  const res = await api.get('/api/admin/metrics/accuracy', {
    headers: getAuthHeaders(),
  });
  return res.data.data;
}

/**
 * Fetch pipeline metrics
 */
export async function fetchPipelineMetrics() {
  const res = await api.get('/api/admin/metrics/pipelines', {
    headers: getAuthHeaders(),
  });
  return res.data.data;
}

/**
 * Fetch signal metrics
 */
export async function fetchSignalMetrics() {
  const res = await api.get('/api/admin/metrics/signals', {
    headers: getAuthHeaders(),
  });
  return res.data.data;
}

/**
 * Invalidate metrics cache
 */
export async function invalidateMetricsCache(key = null) {
  const res = await api.post('/api/admin/metrics/invalidate', 
    key ? { key } : {},
    { headers: getAuthHeaders() }
  );
  return res.data.ok;
}
