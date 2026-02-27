/**
 * Engine V2 & Rankings V2 API Client
 * 
 * API for Engine V2 decisions and Rankings V2
 */

const API_BASE = process.env.REACT_APP_BACKEND_URL;

// ============ ENGINE V2 ============

/**
 * Get Engine V2 decision for a subject
 */
export async function getEngineV2Decision(params = {}) {
  const { actor, asset, window = '24h' } = params;
  
  const queryParams = new URLSearchParams();
  queryParams.set('window', window);
  if (actor) queryParams.set('actor', actor);
  if (asset) queryParams.set('asset', asset);
  
  const response = await fetch(`${API_BASE}/api/engine/v2/decide?${queryParams}`);
  return response.json();
}

/**
 * Get Engine V2 health status
 */
export async function getEngineV2Health(window = '24h') {
  const response = await fetch(`${API_BASE}/api/engine/v2/health?window=${window}`);
  return response.json();
}

/**
 * Batch analyze multiple subjects
 */
export async function analyzeEngineV2Batch(subjects, window = '24h') {
  const response = await fetch(`${API_BASE}/api/engine/v2/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subjects, window })
  });
  return response.json();
}

// ============ RANKINGS V2 ============

/**
 * Compute rankings for all entities
 */
export async function computeRankingsV2(params = {}) {
  const { window = '24h', scope = 'tokens', limit = 200 } = params;
  
  const response = await fetch(`${API_BASE}/api/rankings/v2/compute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ window, scope, limit })
  });
  return response.json();
}

/**
 * Get latest rankings
 */
export async function getLatestRankingsV2(params = {}) {
  const { window = '24h', bucket, limit = 100 } = params;
  
  const queryParams = new URLSearchParams();
  queryParams.set('window', window);
  queryParams.set('limit', String(limit));
  if (bucket) queryParams.set('bucket', bucket);
  
  const response = await fetch(`${API_BASE}/api/rankings/v2/latest?${queryParams}`);
  return response.json();
}

/**
 * Get ranking attribution for a token
 */
export async function getRankingAttribution(tokenId, window = '24h') {
  const queryParams = new URLSearchParams();
  queryParams.set('token', tokenId);
  queryParams.set('window', window);
  
  const response = await fetch(`${API_BASE}/api/rankings/v2/attribution?${queryParams}`);
  return response.json();
}

/**
 * Get fresh ranking for a specific token
 */
export async function getTokenRankingV2(entityId, window = '24h') {
  const response = await fetch(`${API_BASE}/api/rankings/v2/token/${entityId}?window=${window}`);
  return response.json();
}

// ============ SHADOW MODE ============

/**
 * Get Shadow Mode comparison summary
 */
export async function getShadowSummary(window = '24h') {
  const response = await fetch(`${API_BASE}/api/shadow/summary?window=${window}`);
  return response.json();
}

/**
 * Get Shadow Mode recent comparisons
 */
export async function getShadowComparisons(params = {}) {
  const { window = '24h', limit = 50 } = params;
  
  const queryParams = new URLSearchParams();
  queryParams.set('window', window);
  queryParams.set('limit', String(limit));
  
  const response = await fetch(`${API_BASE}/api/shadow/comparisons?${queryParams}`);
  return response.json();
}

/**
 * Get kill switch status
 */
export async function getKillSwitchStatus() {
  const response = await fetch(`${API_BASE}/api/shadow/kill-switch`);
  return response.json();
}

// Export grouped APIs
export const engineV2Api = {
  decide: getEngineV2Decision,
  health: getEngineV2Health,
  analyzeBatch: analyzeEngineV2Batch,
};

export const rankingsV2Api = {
  compute: computeRankingsV2,
  latest: getLatestRankingsV2,
  attribution: getRankingAttribution,
  token: getTokenRankingV2,
};

export const shadowApi = {
  summary: getShadowSummary,
  comparisons: getShadowComparisons,
  killSwitch: getKillSwitchStatus,
};

export default {
  engine: engineV2Api,
  rankings: rankingsV2Api,
  shadow: shadowApi,
};
