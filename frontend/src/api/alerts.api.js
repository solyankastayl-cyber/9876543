/**
 * Alerts API Module (P0 - Full Implementation)
 * 
 * Handles:
 * - Alert rules (create, update, delete)
 * - Alert feed (list, acknowledge)
 * - Alert explanations
 * - Telegram connection
 */
import { api, apiCall } from './client';

// ============================================================================
// ALERT RULES
// ============================================================================

/**
 * Create alert rule
 * @param {Object} rule - Alert rule configuration
 * @param {string} rule.scope - 'token' | 'actor' | 'entity' | 'strategy'
 * @param {string} rule.targetId - Token address, actor address, etc.
 * @param {string[]} rule.triggerTypes - Array of trigger types
 * @param {number} [rule.minSeverity=50] - Minimum severity (0-100)
 * @param {number} [rule.minConfidence=0.6] - Minimum confidence (0-1)
 * @param {string} [rule.throttle='6h'] - Throttle interval
 * @param {string} [rule.name] - Custom name
 */
export async function createAlertRule(rule) {
  return apiCall(
    api.post('/api/alerts/rules', rule)
  );
}

/**
 * Get user's alert rules
 * @param {boolean} [activeOnly=false] - Filter by active only
 */
export async function getAlertRules(activeOnly = false) {
  return apiCall(
    api.get('/api/alerts/rules', {
      params: { activeOnly },
    })
  );
}

/**
 * Update alert rule
 * @param {string} ruleId - Rule ID
 * @param {Object} update - Fields to update
 */
export async function updateAlertRule(ruleId, update) {
  return apiCall(
    api.put(`/api/alerts/rules/${ruleId}`, update)
  );
}

/**
 * Delete alert rule
 * @param {string} ruleId - Rule ID
 */
export async function deleteAlertRule(ruleId) {
  return apiCall(
    api.delete(`/api/alerts/rules/${ruleId}`)
  );
}

// ============================================================================
// ALERT FEED
// ============================================================================

/**
 * Get alerts feed
 * @param {Object} options - Query options
 * @param {boolean} [options.unacknowledged] - Only unacknowledged
 * @param {number} [options.limit=50] - Limit
 * @param {number} [options.offset=0] - Offset
 */
export async function getAlertsFeed(options = {}) {
  return apiCall(
    api.get('/api/alerts/feed', {
      params: options,
    })
  );
}

/**
 * Acknowledge alert
 * @param {string} alertId - Alert ID
 */
export async function acknowledgeAlert(alertId) {
  return apiCall(
    api.post(`/api/alerts/${alertId}/ack`)
  );
}

/**
 * Acknowledge all alerts
 */
export async function acknowledgeAllAlerts() {
  return apiCall(
    api.post('/api/alerts/ack-all')
  );
}

/**
 * Get alerts stats
 */
export async function getAlertsStats() {
  return apiCall(
    api.get('/api/alerts/stats')
  );
}

// ============================================================================
// ALERT EXPLANATIONS
// ============================================================================

/**
 * Get alert explanation (WHY/WHY NOW/Evidence/Risks)
 * @param {string} alertId - Alert ID
 */
export async function getAlertExplanation(alertId) {
  return apiCall(
    api.get(`/api/explain/alert/${alertId}`)
  );
}

// ============================================================================
// TELEGRAM
// ============================================================================

/**
 * Get Telegram connection status
 */
export async function getTelegramConnection() {
  return apiCall(
    api.get('/api/telegram/connection')
  );
}

/**
 * Generate Telegram connection link
 */
export async function connectTelegram() {
  return apiCall(
    api.post('/api/telegram/connect')
  );
}

/**
 * Disconnect Telegram
 */
export async function disconnectTelegram() {
  return apiCall(
    api.post('/api/telegram/disconnect')
  );
}

/**
 * Send test notification
 */
export async function testTelegramNotification() {
  return apiCall(
    api.post('/api/telegram/test')
  );
}
