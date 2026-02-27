/**
 * Attribution API Module (Phase 15.5)
 */
import { api, apiCall } from './client';

/**
 * Get all claims for a subject (actor/entity)
 */
export async function getSubjectAddresses(subjectType, subjectId) {
  return apiCall(
    api.get(`/api/attribution/subject/${subjectType}/${subjectId}`)
  );
}

/**
 * Get attribution status for an address (reverse lookup)
 */
export async function getAddressAttribution(chain, address) {
  return apiCall(
    api.get(`/api/attribution/address/${chain}/${address}`)
  );
}

/**
 * Load seed data
 */
export async function loadSeedData() {
  return apiCall(
    api.post('/api/attribution/seed')
  );
}

/**
 * Get all subjects with claims
 */
export async function getAllSubjects() {
  return apiCall(
    api.get('/api/attribution/subjects')
  );
}

export const attributionApi = {
  getSubjectAddresses,
  getAddressAttribution,
  loadSeedData,
  getAllSubjects,
};
