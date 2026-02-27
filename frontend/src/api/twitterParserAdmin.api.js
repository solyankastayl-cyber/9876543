/**
 * Twitter Parser Admin API
 * API client for managing Twitter accounts and egress slots
 */

import { api } from './client';

const BASE_URL = '/api/admin/twitter-parser';

// ==================== ACCOUNTS ====================

export async function getTwitterAccounts(status) {
  const params = status ? `?status=${status}` : '';
  const response = await api.get(`${BASE_URL}/accounts${params}`);
  return response.data;
}

export async function getTwitterAccount(id) {
  const response = await api.get(`${BASE_URL}/accounts/${id}`);
  return response.data;
}

export async function createTwitterAccount(data) {
  const response = await api.post(`${BASE_URL}/accounts`, data);
  return response.data;
}

export async function updateTwitterAccount(id, data) {
  // Use PUT for MULTI architecture
  const response = await api.put(`${BASE_URL}/accounts/${id}`, data);
  return response.data;
}

export async function setAccountStatus(id, status) {
  const response = await api.patch(`${BASE_URL}/accounts/${id}/status`, { status });
  return response.data;
}

export async function enableTwitterAccount(id) {
  return setAccountStatus(id, 'ACTIVE');
}

export async function disableTwitterAccount(id) {
  return setAccountStatus(id, 'DISABLED');
}

export async function deleteTwitterAccount(id) {
  const response = await api.delete(`${BASE_URL}/accounts/${id}`);
  return response.data;
}

// ==================== EGRESS SLOTS ====================

export async function getEgressSlots(filter) {
  const params = new URLSearchParams();
  if (filter?.enabled !== undefined) params.set('enabled', filter.enabled);
  if (filter?.type) params.set('type', filter.type);
  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await api.get(`${BASE_URL}/slots${query}`);
  return response.data;
}

export async function getEgressSlot(id) {
  const response = await api.get(`${BASE_URL}/slots/${id}`);
  return response.data;
}

export async function createEgressSlot(data) {
  const response = await api.post(`${BASE_URL}/slots`, data);
  return response.data;
}

export async function updateEgressSlot(id, data) {
  // Use PUT for MULTI architecture
  const response = await api.put(`${BASE_URL}/slots/${id}`, data);
  return response.data;
}

export async function setSlotStatus(id, status) {
  const response = await api.patch(`${BASE_URL}/slots/${id}/status`, { status });
  return response.data;
}

export async function enableEgressSlot(id) {
  return setSlotStatus(id, 'ACTIVE');
}

export async function disableEgressSlot(id) {
  return setSlotStatus(id, 'DISABLED');
}

export async function bindSlotAccount(slotId, accountId) {
  const response = await api.post(`${BASE_URL}/slots/${slotId}/bind-account`, { accountId });
  return response.data;
}

export async function unbindSlotAccount(slotId) {
  const response = await api.post(`${BASE_URL}/slots/${slotId}/unbind-account`);
  return response.data;
}

export async function deleteEgressSlot(id) {
  const response = await api.delete(`${BASE_URL}/slots/${id}`);
  return response.data;
}

export async function resetSlotWindow(id) {
  const response = await api.post(`${BASE_URL}/slots/${id}/reset-window`);
  return response.data;
}

export async function testSlotConnectivity(id) {
  const response = await api.post(`${BASE_URL}/slots/${id}/test`);
  return response.data;
}

export async function getAvailableSlots() {
  const response = await api.get(`${BASE_URL}/slots/available`);
  return response.data;
}

export async function recoverCooldowns() {
  const response = await api.post(`${BASE_URL}/slots/recover-cooldowns`);
  return response.data;
}

// ==================== SESSIONS (MULTI Architecture) ====================

export async function getSessions() {
  const response = await api.get(`${BASE_URL}/sessions`);
  return response.data;
}

export async function getSession(sessionId) {
  const response = await api.get(`${BASE_URL}/sessions/${sessionId}`);
  return response.data;
}

export async function getWebhookInfo() {
  const response = await api.get(`${BASE_URL}/sessions/webhook/info`);
  return response.data;
}

export async function ingestSession(data) {
  const response = await api.post(`${BASE_URL}/sessions/webhook`, data);
  return response.data;
}

export async function testSession(sessionId) {
  const response = await api.post(`${BASE_URL}/sessions/${sessionId}/test`);
  return response.data;
}

export async function bindSessionToAccount(sessionId, accountId) {
  const response = await api.post(`${BASE_URL}/sessions/${sessionId}/bind`, { accountId });
  return response.data;
}

export async function setSessionStatus(sessionId, status) {
  const response = await api.patch(`${BASE_URL}/sessions/${sessionId}/status`, { status });
  return response.data;
}

export async function deleteSession(sessionId) {
  const response = await api.delete(`${BASE_URL}/sessions/${sessionId}`);
  return response.data;
}

// ==================== MONITOR ====================

export async function getParserMonitor() {
  const response = await api.get(`${BASE_URL}/monitor`);
  return response.data;
}

// ==================== RUNTIME HEALTH CHECK ====================

export async function testSlotConnection(slotId) {
  const response = await api.post(`/api/v4/twitter/runtime/health-check/${slotId}`);
  return response.data;
}

// ==================== P3 FREEZE VALIDATION ====================

export async function runFreezeValidation(profile = 'SMOKE') {
  const response = await api.post(`${BASE_URL}/freeze/run`, { profile });
  return response.data;
}

export async function getFreezeStatus() {
  const response = await api.get(`${BASE_URL}/freeze/status`);
  return response.data;
}

export async function getFreezeLast() {
  const response = await api.get(`${BASE_URL}/freeze/latest`);
  return response.data;
}

export async function abortFreezeValidation() {
  const response = await api.post(`${BASE_URL}/freeze/abort`);
  return response.data;
}

export async function getMetricsSnapshot() {
  const response = await api.get(`${BASE_URL}/metrics/snapshot`);
  return response.data;
}

export async function resetMetrics() {
  const response = await api.post(`${BASE_URL}/metrics/reset`);
  return response.data;
}
