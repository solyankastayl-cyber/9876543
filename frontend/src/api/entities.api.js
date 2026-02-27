/**
 * Entity API Client (Phase 15.5.2)
 */
import { api } from './client';

/**
 * Get entity profile
 * @param {string} id - Entity ID or address
 */
export async function getEntityProfile(id) {
  const response = await api.get(`/api/entities/${id}/profile`);
  return response.data;
}

/**
 * Get actors belonging to entity
 * @param {string} id - Entity ID
 */
export async function getEntityActors(id) {
  const response = await api.get(`/api/entities/${id}/actors`);
  return response.data;
}

/**
 * Get strategies used by entity
 * @param {string} id - Entity ID
 */
export async function getEntityStrategies(id) {
  const response = await api.get(`/api/entities/${id}/strategies`);
  return response.data;
}
