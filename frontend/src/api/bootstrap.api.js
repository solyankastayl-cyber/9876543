/**
 * Bootstrap API Client (P2.1 Step 3)
 * 
 * API client for bootstrap task status and polling.
 */
import { api } from './index';

/**
 * Get bootstrap task status by dedupKey (for polling)
 */
export async function getStatus(dedupKey) {
  const response = await api.get(`/api/bootstrap/status?dedupKey=${encodeURIComponent(dedupKey)}`);
  return response.data?.data;
}

/**
 * Get bootstrap task status by subject
 */
export async function getStatusBySubject(subjectType, chain, identifier) {
  const response = await api.get(`/api/bootstrap/status/${subjectType}/${chain}/${identifier}`);
  return response.data?.data;
}

/**
 * Get bootstrap queue stats
 */
export async function getStats() {
  const response = await api.get('/api/bootstrap/stats');
  return response.data?.data;
}

/**
 * Manually enqueue a bootstrap task
 */
export async function enqueue({ subjectType, chain, address, subjectId, tokenAddress, priority }) {
  const response = await api.post('/api/bootstrap/enqueue', {
    subjectType,
    chain: chain || 'ethereum',
    address,
    subjectId,
    tokenAddress,
    priority,
  });
  return response.data?.data;
}

export default {
  getStatus,
  getStatusBySubject,
  getStats,
  enqueue,
};
