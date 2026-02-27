/**
 * BLOCK 6.1 — Exchange Segments API Client
 * =========================================
 * 
 * Frontend API for fetching real ML prediction segments.
 * No synthetic bridges - only real segment-based predictions.
 */

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * Fetch all segments for a given asset/horizon.
 * Returns timeline of predictions (ACTIVE + SUPERSEDED).
 */
export async function fetchExchangeSegments(params) {
  const { asset = 'BTC', horizon = '30D', limit = 50 } = params;
  
  const qs = new URLSearchParams({
    asset: asset.toUpperCase(),
    horizon: horizon.toUpperCase(),
    limit: String(limit),
  });
  
  const url = `${API_URL}/api/exchange/segments?${qs.toString()}`;
  const res = await fetch(url);
  
  if (!res.ok) {
    throw new Error(`Failed to fetch segments: ${res.status}`);
  }
  
  return res.json();
}

/**
 * Fetch candles for a specific segment.
 * Uses V3.11 Adaptive Trajectory Engine on backend.
 */
export async function fetchSegmentCandles(segmentId) {
  if (!segmentId) {
    throw new Error('segmentId is required');
  }
  
  const url = `${API_URL}/api/exchange/segment-candles?segmentId=${encodeURIComponent(segmentId)}`;
  const res = await fetch(url);
  
  if (!res.ok) {
    throw new Error(`Failed to fetch segment candles: ${res.status}`);
  }
  
  return res.json();
}

/**
 * Manually trigger segment roll (admin/testing).
 */
export async function triggerSegmentRoll(params) {
  const { asset = 'BTC', horizon = '30D', reason = 'MANUAL' } = params;
  
  const url = `${API_URL}/api/admin/exchange/segments/roll`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ asset, horizon, reason }),
  });
  
  if (!res.ok) {
    throw new Error(`Failed to trigger roll: ${res.status}`);
  }
  
  return res.json();
}

/**
 * Get segment statistics.
 */
export async function fetchSegmentStats() {
  const url = `${API_URL}/api/admin/exchange/segments/stats`;
  const res = await fetch(url);
  
  if (!res.ok) {
    throw new Error(`Failed to fetch stats: ${res.status}`);
  }
  
  return res.json();
}

export default {
  fetchExchangeSegments,
  fetchSegmentCandles,
  triggerSegmentRoll,
  fetchSegmentStats,
};
