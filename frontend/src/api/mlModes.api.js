/**
 * Phase 6: ML Modes API
 */
import { api } from './client';

/**
 * Get current ML mode state
 */
export async function getModeState() {
  const res = await api.get('/api/ml/mode/state');
  return res.data;
}

/**
 * Set ML mode: OFF | ADVISOR | ASSIST
 */
export async function setMode(mode, triggeredBy = 'user') {
  const res = await api.post('/api/ml/mode/set', { mode, triggeredBy });
  return res.data;
}

/**
 * Trigger kill switch manually
 */
export async function triggerKillSwitch(reason = 'Manual trigger') {
  const res = await api.post('/api/ml/mode/kill', { reason, triggeredBy: 'user' });
  return res.data;
}

/**
 * Reset (re-arm) kill switch
 */
export async function resetKillSwitch() {
  const res = await api.post('/api/ml/mode/reset', { triggeredBy: 'user' });
  return res.data;
}

/**
 * Run health check with metrics
 */
export async function healthCheck(flipRate, ece) {
  const res = await api.post('/api/ml/mode/health-check', { flipRate, ece });
  return res.data;
}

/**
 * Get mode audit history
 */
export async function getModeAudit(limit = 50) {
  const res = await api.get('/api/ml/mode/audit', { params: { limit } });
  return res.data;
}

/**
 * Get kill switch events
 */
export async function getKillSwitchEvents(limit = 20) {
  const res = await api.get('/api/ml/mode/kill-events', { params: { limit } });
  return res.data;
}

/**
 * Run Phase 6 attack tests
 */
export async function runModeAttackTests() {
  const res = await api.post('/api/ml/mode/attack-tests');
  return res.data;
}
