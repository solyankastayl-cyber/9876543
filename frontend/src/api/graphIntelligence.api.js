/**
 * Graph Intelligence API (P1.8 + ETAP B1)
 * 
 * API client for Graph Intelligence endpoints.
 * Single point of entry for all graph intelligence requests.
 * 
 * ETAP B1: All requests require network parameter
 */

const API_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * Fetch graph by wallet address
 * 
 * ETAP B1: Requires network parameter
 * P2.2: Now supports calibrated mode via options.mode
 * - 'raw' = legacy behavior (default)
 * - 'calibrated' = returns CalibratedGraphSnapshot with corridors
 */
export async function fetchGraphByAddress(address, options = {}) {
  const params = new URLSearchParams();
  
  // ETAP B1: Network is required
  const network = options.network || 'ethereum';
  params.set('network', network);
  
  if (options.maxRoutes) params.set('maxRoutes', options.maxRoutes.toString());
  if (options.maxEdges) params.set('maxEdges', options.maxEdges.toString());
  if (options.timeWindowHours) params.set('timeWindowHours', options.timeWindowHours.toString());
  if (options.chains?.length) params.set('chains', options.chains.join(','));
  
  // P2.2: Calibration mode - defaults to 'calibrated' for Graph Intelligence
  if (options.mode) params.set('mode', options.mode);
  
  const queryString = params.toString();
  const url = `${API_URL}/api/graph-intelligence/address/${address}${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!data.ok) {
    throw new Error(data.error || 'Failed to fetch graph');
  }
  
  return data.data;
}

/**
 * Fetch graph by route ID
 * 
 * P2.2: Now supports calibrated mode via options.mode
 * - 'raw' = legacy behavior (default)
 * - 'calibrated' = returns CalibratedGraphSnapshot with corridors
 */
export async function fetchGraphByRoute(routeId, options = {}) {
  const params = new URLSearchParams();
  
  if (options.maxEdges) params.set('maxEdges', options.maxEdges.toString());
  
  // P2.2: Calibration mode - defaults to 'calibrated' for Graph Intelligence
  if (options.mode) params.set('mode', options.mode);
  
  const queryString = params.toString();
  const url = `${API_URL}/api/graph-intelligence/route/${routeId}${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!data.ok) {
    throw new Error(data.error || 'Failed to fetch graph');
  }
  
  return data.data;
}

/**
 * Fetch cached snapshot by ID
 */
export async function fetchCachedSnapshot(snapshotId) {
  const url = `${API_URL}/api/graph-intelligence/cached/${snapshotId}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!data.ok) {
    throw new Error(data.error || 'Snapshot not found or expired');
  }
  
  return data.data;
}

/**
 * Fetch graph intelligence stats
 */
export async function fetchGraphStats() {
  const url = `${API_URL}/api/graph-intelligence/stats`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!data.ok) {
    throw new Error(data.error || 'Failed to fetch stats');
  }
  
  return data.stats;
}

/**
 * Fetch graph intelligence health
 */
export async function fetchGraphHealth() {
  const url = `${API_URL}/api/graph-intelligence/health`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  return data;
}

/**
 * Clear expired cache (admin)
 */
export async function clearExpiredCache() {
  const url = `${API_URL}/api/graph-intelligence/cache/clear`;
  
  const response = await fetch(url, { method: 'DELETE' });
  const data = await response.json();
  
  if (!data.ok) {
    throw new Error(data.error || 'Failed to clear cache');
  }
  
  return data.deletedCount;
}

export default {
  fetchGraphByAddress,
  fetchGraphByRoute,
  fetchCachedSnapshot,
  fetchGraphStats,
  fetchGraphHealth,
  clearExpiredCache,
};
