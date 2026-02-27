/**
 * Twitter Integration API Client
 * 
 * Single source for all Twitter integration API calls
 */

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

/**
 * @typedef {'NOT_CONNECTED' | 'CONSENT_REQUIRED' | 'NEED_COOKIES' | 'SESSION_OK' | 'SESSION_STALE' | 'SESSION_INVALID'} IntegrationState
 */

/**
 * @typedef {Object} IntegrationStatus
 * @property {IntegrationState} state
 * @property {number} accounts
 * @property {{ total: number, ok: number, stale: number, invalid: number }} sessions
 * @property {{ consentAccepted: boolean, primaryAccount?: { username: string } }} [details]
 */

/**
 * Get current integration status
 * @returns {Promise<IntegrationStatus>}
 */
export async function getIntegrationStatus() {
  const res = await fetch(`${API_BASE}/api/v4/twitter/integration/status`, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Failed to get status');
  return data.data;
}

/**
 * Get Twitter Data Usage Policy with consent status
 * @returns {Promise<{policy: Object, userConsent: Object}>}
 */
export async function getPolicy() {
  const res = await fetch(`${API_BASE}/api/v4/integrations/twitter/policy`, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Failed to get policy');
  return data.data;
}

/**
 * Accept policy consent
 * @param {string} version - Policy version to accept
 * @returns {Promise<{ accepted: boolean, version: string, state: IntegrationState }>}
 */
export async function acceptPolicyConsent(version) {
  const res = await fetch(`${API_BASE}/api/v4/integrations/twitter/policy/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ version }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Failed to accept policy');
  return data.data;
}

/**
 * Accept consent (legacy - uses new policy system internally)
 * @returns {Promise<{ state: IntegrationState }>}
 */
export async function acceptConsent() {
  const res = await fetch(`${API_BASE}/api/v4/twitter/consent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ accepted: true }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Failed to accept consent');
  return data;
}

/**
 * Link Telegram for notifications
 * @param {string} chatId 
 * @returns {Promise<void>}
 */
export async function linkTelegram(chatId) {
  const res = await fetch(`${API_BASE}/api/v4/twitter/telegram/link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ chatId }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Failed to link Telegram');
}

/**
 * Get user accounts list
 * @returns {Promise<{accounts: Array, total: number, limit: number}>}
 */
export async function getAccounts() {
  const res = await fetch(`${API_BASE}/api/v4/twitter/accounts`, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Failed to get accounts');
  return data.data || { accounts: [], total: 0, limit: 3 };
}

/**
 * Add a new Twitter account
 * @param {string} username 
 * @param {string} [displayName]
 * @returns {Promise<Object>}
 */
export async function addAccount(username, displayName) {
  const res = await fetch(`${API_BASE}/api/v4/twitter/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, displayName }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Failed to add account');
  return data.data;
}

/**
 * Delete a Twitter account
 * @param {string} accountId 
 * @returns {Promise<void>}
 */
export async function deleteAccount(accountId) {
  const res = await fetch(`${API_BASE}/api/v4/twitter/accounts/${accountId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || data.message || 'Failed to delete account');
}

/**
 * Set account as preferred
 * @param {string} accountId 
 * @returns {Promise<void>}
 */
export async function setPreferredAccount(accountId) {
  const res = await fetch(`${API_BASE}/api/v4/twitter/accounts/${accountId}/preferred`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Failed to set preferred');
}

/**
 * Enable/disable account
 * @param {string} accountId 
 * @param {boolean} enabled
 * @returns {Promise<void>}
 */
export async function toggleAccount(accountId, enabled) {
  const endpoint = enabled ? 'enable' : 'disable';
  const res = await fetch(`${API_BASE}/api/v4/twitter/accounts/${accountId}/${endpoint}`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Failed to toggle account');
}

// ============================================================
// A.2.2 - Sessions API
// ============================================================

/**
 * Get sessions for an account
 * @param {string} accountId 
 * @param {Object} options
 * @param {boolean} [options.onlyActive]
 * @returns {Promise<{sessions: Array, total: number, activeCount: number}>}
 */
export async function getAccountSessions(accountId, options = {}) {
  const params = new URLSearchParams();
  if (options.onlyActive) params.set('onlyActive', 'true');
  
  const url = `${API_BASE}/api/v4/twitter/accounts/${accountId}/sessions${params.toString() ? '?' + params : ''}`;
  const res = await fetch(url, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Failed to get sessions');
  return data.data;
}

/**
 * Get refresh hint for account
 * @param {string} accountId 
 * @returns {Promise<Object>}
 */
export async function getRefreshHint(accountId) {
  const res = await fetch(`${API_BASE}/api/v4/twitter/accounts/${accountId}/sessions/refresh-hint`, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Failed to get refresh hint');
  return data.data;
}

/**
 * Get session details
 * @param {string} accountId 
 * @param {string} sessionId 
 * @returns {Promise<Object>}
 */
export async function getSessionDetails(accountId, sessionId) {
  const res = await fetch(`${API_BASE}/api/v4/twitter/accounts/${accountId}/sessions/${sessionId}`, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Failed to get session details');
  return data.data;
}
