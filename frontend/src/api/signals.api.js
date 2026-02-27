/**
 * Signals API Module
 */
import { api, apiCall } from './client';

/**
 * Fetch latest signals (paginated)
 */
export async function getLatestSignals(page = 1, limit = 50) {
  return apiCall(
    api.get('/api/signals/latest', {
      params: { page, limit },
    })
  );
}

/**
 * Fetch signal trust snapshot
 */
export async function getSignalTrust(signalId) {
  return apiCall(
    api.get(`/api/reputation/trust/signal/${signalId}`)
  );
}

/**
 * Fetch signal reputation (full metrics)
 */
export async function getSignalReputation(signalId) {
  return apiCall(
    api.get(`/api/reputation/signal/${signalId}`)
  );
}

/**
 * Get top signals by trust score
 */
export async function getTopSignals(limit = 50) {
  return apiCall(
    api.get('/api/reputation/signal/top', {
      params: { limit },
    })
  );
}
