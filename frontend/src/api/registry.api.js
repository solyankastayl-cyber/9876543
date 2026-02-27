/**
 * Registry API Client
 * 
 * Token Registry + Address Labels (P0.2)
 */
import { api } from './client';

// ============================================
// Token Registry
// ============================================

export async function searchTokens(params = {}) {
  const { data } = await api.get('/api/registry/tokens', { params });
  return data;
}

export async function getToken(chain, address) {
  const { data } = await api.get(`/api/registry/tokens/${chain}/${address}`);
  return data;
}

export async function upsertToken(tokenData) {
  const { data } = await api.post('/api/registry/tokens/upsert', tokenData);
  return data;
}

export async function getTokenStats() {
  const { data } = await api.get('/api/registry/tokens/stats');
  return data;
}

export async function searchCanonical(params = {}) {
  const { data } = await api.get('/api/registry/tokens/canonical', { params });
  return data;
}

export async function getCanonical(canonicalId) {
  const { data } = await api.get(`/api/registry/tokens/canonical/${canonicalId}`);
  return data;
}

export async function upsertCanonical(canonicalData) {
  const { data } = await api.post('/api/registry/tokens/canonical/upsert', canonicalData);
  return data;
}

export async function getCanonicalStats() {
  const { data } = await api.get('/api/registry/tokens/canonical/stats');
  return data;
}

export async function seedCanonicalMappings() {
  const { data } = await api.post('/api/registry/tokens/canonical/seed');
  return data;
}

// ============================================
// Address Labels
// ============================================

export async function searchLabels(params = {}) {
  const { data } = await api.get('/api/labels', { params });
  return data;
}

export async function getLabel(chain, address) {
  const { data } = await api.get(`/api/labels/${chain}/${address}`);
  return data;
}

export async function upsertLabel(labelData) {
  const { data } = await api.post('/api/labels/upsert', labelData);
  return data;
}

export async function deleteLabel(chain, address) {
  const { data } = await api.delete(`/api/labels/${chain}/${address}`);
  return data;
}

export async function verifyLabel(chain, address, verifiedBy = 'admin') {
  const { data } = await api.post(`/api/labels/${chain}/${address}/verify`, { verifiedBy });
  return data;
}

export async function getLabelsByCategory(category, chain = null, limit = 500) {
  const params = { limit };
  if (chain) params.chain = chain;
  const { data } = await api.get(`/api/labels/category/${category}`, { params });
  return data;
}

export async function getLabelsStats() {
  const { data } = await api.get('/api/labels/stats');
  return data;
}

export async function resolveAddresses(addresses) {
  const { data } = await api.post('/api/labels/resolve', { addresses });
  return data;
}

export async function seedKnownLabels() {
  const { data } = await api.post('/api/labels/seed');
  return data;
}

// ============================================
// Exchange Entities
// ============================================

export async function searchExchanges(params = {}) {
  const { data } = await api.get('/api/exchanges', { params });
  return data;
}

export async function getExchange(identifier) {
  const { data } = await api.get(`/api/exchanges/${identifier}`);
  return data;
}

export async function upsertExchange(exchangeData) {
  const { data } = await api.post('/api/exchanges/upsert', exchangeData);
  return data;
}

export async function addWalletToExchange(entityId, wallet) {
  const { data } = await api.post(`/api/exchanges/${entityId}/wallets`, wallet);
  return data;
}

export async function removeWalletFromExchange(entityId, chain, address) {
  const { data } = await api.delete(`/api/exchanges/${entityId}/wallets/${chain}/${address}`);
  return data;
}

export async function deleteExchange(entityId) {
  const { data } = await api.delete(`/api/exchanges/${entityId}`);
  return data;
}

export async function getExchangeStats() {
  const { data } = await api.get('/api/exchanges/stats');
  return data;
}
