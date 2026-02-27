/**
 * Twitter System Admin API v4
 * 
 * API client for /api/v4/admin/twitter/system endpoints
 * Phase 7.1 - Admin System Control Panel
 */

import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const BASE_URL = '/api/v4/admin/twitter/system';

// Create axios instance with admin headers
const adminApi = axios.create({
  baseURL: BACKEND_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': 'dev-user', // Admin user
  },
});

// ==================== HEALTH ====================

export async function getSystemHealth() {
  const response = await adminApi.get(`${BASE_URL}/health`);
  return response.data;
}

export async function getWorkerStatus() {
  const response = await adminApi.get(`${BASE_URL}/worker`);
  return response.data;
}

export async function getParsersStatus() {
  const response = await adminApi.get(`${BASE_URL}/parsers`);
  return response.data;
}

export async function getSystemOverview() {
  const response = await adminApi.get(`${BASE_URL}/overview`);
  return response.data;
}

export async function getQualityMetrics() {
  const response = await adminApi.get(`${BASE_URL}/quality`);
  return response.data;
}

// ==================== SESSIONS ====================

export async function getSessions(params = {}) {
  const query = new URLSearchParams();
  if (params.status) query.append('status', params.status);
  if (params.limit) query.append('limit', params.limit);
  if (params.sort) query.append('sort', params.sort);
  
  const queryStr = query.toString() ? `?${query.toString()}` : '';
  const response = await adminApi.get(`${BASE_URL}/sessions${queryStr}`);
  return response.data;
}

export async function forceResyncSession(sessionId) {
  const response = await adminApi.post(`${BASE_URL}/sessions/${sessionId}/resync`);
  return response.data;
}

// ==================== TASKS ====================

export async function getTasks(params = {}) {
  const query = new URLSearchParams();
  if (params.limit) query.append('limit', params.limit);
  if (params.status) query.append('status', params.status);
  if (params.scope) query.append('scope', params.scope);
  if (params.type) query.append('type', params.type);
  
  const queryStr = query.toString() ? `?${query.toString()}` : '';
  const response = await adminApi.get(`${BASE_URL}/tasks${queryStr}`);
  return response.data;
}

export async function retryTask(taskId) {
  const response = await adminApi.post(`${BASE_URL}/tasks/${taskId}/retry`);
  return response.data;
}

export async function forceParse(data) {
  const response = await adminApi.post(`${BASE_URL}/parse`, data);
  return response.data;
}

// ==================== SESSION HEALTH CHECK ====================

export async function triggerSessionHealthCheck() {
  const response = await adminApi.post(`${BASE_URL}/session-health/check`);
  return response.data;
}

export default {
  getSystemHealth,
  getWorkerStatus,
  getParsersStatus,
  getSystemOverview,
  getQualityMetrics,
  getSessions,
  forceResyncSession,
  getTasks,
  retryTask,
  forceParse,
  triggerSessionHealthCheck,
};
