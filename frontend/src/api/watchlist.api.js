/**
 * Watchlist API Module V2
 * 
 * Handles:
 * - Get user's watchlist items with event counts
 * - Add/remove items
 * - Get summary stats
 * - Get events
 */
import { api, apiCall } from './client';

/**
 * Get user's watchlist items with event counts
 * @param {string} [type] - Filter by type: 'token' | 'wallet' | 'actor'
 */
export async function getWatchlist(type) {
  return apiCall(
    api.get('/api/watchlist', {
      params: type ? { type } : {},
    })
  );
}

/**
 * Get watchlist summary stats
 */
export async function getWatchlistSummary() {
  return apiCall(
    api.get('/api/watchlist/summary')
  );
}

/**
 * Get watchlist events
 * @param {Object} params - Query params
 * @param {string} [params.chain] - Filter by chain
 * @param {string} [params.severity] - Filter by severity: 'LOW' | 'MEDIUM' | 'HIGH'
 * @param {string} [params.eventType] - Filter by event type
 * @param {string} [params.window] - Time window: '24h' | '7d' | '30d'
 * @param {number} [params.limit] - Max results
 */
export async function getWatchlistEvents(params = {}) {
  return apiCall(
    api.get('/api/watchlist/events', { params })
  );
}

/**
 * Acknowledge an event
 * @param {string} eventId - Event ID
 */
export async function acknowledgeEvent(eventId) {
  return apiCall(
    api.post(`/api/watchlist/events/${eventId}/ack`)
  );
}

/**
 * Add item to watchlist
 * @param {Object} item - Item to add
 * @param {string} item.type - 'token' | 'wallet' | 'actor' | 'entity'
 * @param {Object} item.target - Target details
 * @param {string} item.target.address - Address
 * @param {string} [item.target.chain] - Chain (default: 'ETH')
 * @param {string} [item.target.symbol] - Symbol
 * @param {string} [item.target.name] - Name
 * @param {string} [item.note] - User note
 * @param {string[]} [item.tags] - Tags
 */
export async function addToWatchlist(item) {
  return apiCall(
    api.post('/api/watchlist', item)
  );
}

/**
 * Remove item from watchlist
 * @param {string} itemId - Watchlist item ID
 */
export async function removeFromWatchlist(itemId) {
  return apiCall(
    api.delete(`/api/watchlist/${itemId}`)
  );
}

/**
 * Get single watchlist item with alert count
 * @param {string} itemId - Watchlist item ID
 */
export async function getWatchlistItem(itemId) {
  return apiCall(
    api.get(`/api/watchlist/${itemId}`)
  );
}

/**
 * Seed test data (development only)
 */
export async function seedWatchlist() {
  return apiCall(
    api.post('/api/watchlist/seed')
  );
}

// =============================================================================
// P1.1 - WATCHLIST ACTORS API
// =============================================================================

/**
 * Get aggregated watchlist actors with intelligence data
 */
export async function getWatchlistActors() {
  return apiCall(
    api.get('/api/watchlist/actors')
  );
}

/**
 * Get suggested actors to watch
 * @param {number} [limit=5] - Max results
 */
export async function getSuggestedActors(limit = 5) {
  return apiCall(
    api.get('/api/watchlist/actors/suggested', { params: { limit } })
  );
}

/**
 * Get detailed actor profile
 * @param {string} actorIdOrAddress - Actor ID or wallet address
 */
export async function getActorProfile(actorIdOrAddress) {
  return apiCall(
    api.get(`/api/watchlist/actors/${actorIdOrAddress}/profile`)
  );
}

// =============================================================================
// P2.1 - REALTIME MONITORING API
// =============================================================================

/**
 * Get event changes since timestamp (delta endpoint)
 * @param {string} [since] - ISO timestamp
 * @param {number} [limit=50] - Max results
 */
export async function getEventChanges(since, limit = 50) {
  return apiCall(
    api.get('/api/watchlist/events/changes', { 
      params: { since, limit } 
    })
  );
}

/**
 * Get lightweight realtime summary for polling
 * @param {number} [window=5] - Time window in minutes
 */
export async function getRealtimeSummary(window = 5) {
  return apiCall(
    api.get('/api/watchlist/summary/realtime', { 
      params: { window } 
    })
  );
}

/**
 * Mark events as viewed (batch)
 * @param {string[]} eventIds - Event IDs to mark
 */
export async function markEventsViewed(eventIds) {
  return apiCall(
    api.post('/api/watchlist/events/viewed', { eventIds })
  );
}

/**
 * Get new events count for badge
 * @param {string} [since] - ISO timestamp
 */
export async function getNewEventsCount(since) {
  return apiCall(
    api.get('/api/watchlist/events/count', { 
      params: since ? { since } : {} 
    })
  );
}
