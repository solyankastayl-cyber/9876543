/**
 * Token Resolution API Client (P2.5)
 */
import { api } from './client';

/**
 * Resolve single token address to symbol/metadata
 */
export async function resolveToken(address, chain = 'ethereum') {
  const response = await api.get(`/api/tokens/resolve/${address}`, {
    params: { chain }
  });
  return response.data;
}

/**
 * Resolve multiple tokens at once
 */
export async function resolveTokens(addresses, chain = 'ethereum') {
  const response = await api.post('/api/tokens/resolve/batch', {
    addresses,
    chain
  });
  return response.data;
}

/**
 * Search tokens by symbol or name
 */
export async function searchTokens(query, chain = null, limit = 20) {
  const params = { q: query, limit };
  if (chain) params.chain = chain;
  
  const response = await api.get('/api/tokens/registry/search', { params });
  return response.data;
}

/**
 * Get token registry statistics
 */
export async function getTokenStats() {
  const response = await api.get('/api/tokens/registry/stats');
  return response.data;
}
