/**
 * System Alerts V2 API
 * 
 * Endpoints for System & Intelligence Notifications
 */
import { api, apiCall } from './client';

/**
 * Get system alerts with optional filters
 * @param {Object} filters - Query filters
 * @param {string} [filters.status] - OPEN | ACKED | RESOLVED
 * @param {string} [filters.severity] - INFO | LOW | MEDIUM | HIGH | CRITICAL
 * @param {string} [filters.category] - SYSTEM | ML | MARKET
 * @param {string} [filters.chain] - Chain filter
 * @param {number} [filters.limit] - Max results (default: 100)
 * @param {number} [filters.offset] - Pagination offset
 */
export async function getSystemAlerts(filters = {}) {
  return apiCall(
    api.get('/api/system-alerts', { params: filters })
  );
}

/**
 * Get alerts summary for dashboard header cards
 * Returns: total, active, critical, resolved24h, byCategory, bySeverity
 */
export async function getAlertsSummary() {
  return apiCall(
    api.get('/api/system-alerts/summary')
  );
}

/**
 * Acknowledge an alert
 * @param {string} alertId - Alert ID to acknowledge
 */
export async function acknowledgeAlert(alertId) {
  return apiCall(
    api.post(`/api/system-alerts/${alertId}/ack`, { ackedBy: 'user' })
  );
}

/**
 * Resolve an alert
 * @param {string} alertId - Alert ID to resolve
 */
export async function resolveAlert(alertId) {
  return apiCall(
    api.post(`/api/system-alerts/${alertId}/resolve`)
  );
}

/**
 * Create test alert (development only)
 * @param {Object} params - Test params
 * @param {string} [params.type] - Alert type
 * @param {string} [params.severity] - Alert severity
 */
export async function createTestAlert(params = {}) {
  return apiCall(
    api.post('/api/system-alerts/test', params)
  );
}
