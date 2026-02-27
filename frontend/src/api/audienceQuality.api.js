/**
 * Audience Quality API Client
 */

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

export async function fetchAudienceQuality(actorId) {
  try {
    const response = await fetch(`${API_BASE}/api/connections/audience-quality/${actorId}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data?.data ?? null;
  } catch (error) {
    console.error('[AQE] Failed to fetch audience quality:', error);
    return null;
  }
}

export async function fetchAudienceQualitySummary(actorId) {
  try {
    const response = await fetch(`${API_BASE}/api/connections/audience-quality/${actorId}/summary`);
    if (!response.ok) return null;
    const data = await response.json();
    return data?.data ?? null;
  } catch (error) {
    console.error('[AQE] Failed to fetch AQE summary:', error);
    return null;
  }
}

export async function recomputeAudienceQuality(actorId) {
  try {
    const response = await fetch(`${API_BASE}/api/admin/connections/audience-quality/${actorId}/recompute`, {
      method: 'POST',
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.data ?? null;
  } catch (error) {
    console.error('[AQE] Failed to recompute:', error);
    return null;
  }
}

export async function fetchAudienceQualitySample(actorId, sampleSize = 50) {
  try {
    const response = await fetch(`${API_BASE}/api/admin/connections/audience-quality/${actorId}/sample?sampleSize=${sampleSize}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data ?? null;
  } catch (error) {
    console.error('[AQE] Failed to fetch sample:', error);
    return null;
  }
}

export async function fetchAudienceQualityClassify(actorId, sampleSize = 50) {
  try {
    const response = await fetch(`${API_BASE}/api/admin/connections/audience-quality/${actorId}/classify?sampleSize=${sampleSize}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data ?? null;
  } catch (error) {
    console.error('[AQE] Failed to fetch classification:', error);
    return null;
  }
}
