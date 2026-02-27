/**
 * Actors API Module
 */
import { api, apiCall } from './client';

/**
 * Fetch actor reputation
 */
export async function getActorReputation(address) {
  return apiCall(
    api.get(`/api/reputation/actor/${address}`)
  );
}

/**
 * Fetch actor trust snapshot
 */
export async function getActorTrust(address) {
  return apiCall(
    api.get(`/api/reputation/trust/actor/${address}`)
  );
}

/**
 * Get top actors
 */
export async function getTopActors(limit = 50) {
  return apiCall(
    api.get('/api/reputation/actors/top', {
      params: { limit },
    })
  );
}

/**
 * Get actor timeline
 */
export async function getActorTimeline(address) {
  return apiCall(
    api.get(`/api/timeline/unified/${address}`)
  );
}

/**
 * Get actor strategy explanation
 */
export async function getActorExplanation(address) {
  return apiCall(
    api.get(`/api/explain/strategy/${address}`)
  );
}
