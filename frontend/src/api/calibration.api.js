/**
 * Phase 5: Auto-Calibration API
 */
import { api } from './client';

/**
 * Get active calibration status
 */
export async function getActiveCalibration(window = '7d') {
  const res = await api.get('/api/ml/calibration/active', { params: { window } });
  return res.data;
}

/**
 * Get calibration run history
 */
export async function getCalibrationRuns(window, limit = 20) {
  const params = { limit };
  if (window) params.window = window;
  const res = await api.get('/api/ml/calibration/runs', { params });
  return res.data;
}

/**
 * Build a new calibration map (creates DRAFT)
 */
export async function buildCalibrationMap(params) {
  const { window = '7d', scope = 'global', limit = 1000, realOnly = true } = params;
  const res = await api.post('/api/ml/calibration/build', { window, scope, limit, realOnly });
  return res.data;
}

/**
 * Simulate calibration (dry-run)
 */
export async function simulateCalibration(runId) {
  const res = await api.post('/api/ml/calibration/simulate', { runId });
  return res.data;
}

/**
 * Apply/Activate calibration map
 */
export async function applyCalibration(runId, mapId, mode = 'PRODUCTION') {
  const res = await api.post('/api/ml/calibration/apply', { runId, mapId, mode });
  return res.data;
}

/**
 * Disable calibration for a window
 */
export async function disableCalibration(window, reason = 'Manual disable') {
  const res = await api.post('/api/ml/calibration/disable', { window, reason });
  return res.data;
}

/**
 * Run temporal simulation
 */
export async function simulateTemporal(window, hoursToSimulate = 96, scenario = 'stable') {
  const res = await api.post('/api/ml/calibration/simulate-temporal', { 
    window, hoursToSimulate, scenario 
  });
  return res.data;
}

/**
 * Get specific calibration map details
 */
export async function getCalibrationMap(mapId) {
  const res = await api.get(`/api/ml/calibration/map/${mapId}`);
  return res.data;
}

/**
 * Run attack tests
 */
export async function runAttackTests() {
  const res = await api.post('/api/ml/calibration/attack-tests');
  return res.data;
}
