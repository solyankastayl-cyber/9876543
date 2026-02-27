/**
 * Resolver API Client (Phase 15.5)
 */
import { api } from './client';

/**
 * Resolve any input to entity type + ID
 * @param {string} input - Address, ENS, symbol, tx hash
 */
export async function resolve(input) {
  const response = await api.get('/api/resolve', {
    params: { input }
  });
  return response.data;
}

/**
 * Resolve multiple inputs at once
 * @param {string[]} inputs - Array of inputs to resolve
 */
export async function resolveBatch(inputs) {
  const response = await api.post('/api/resolve/batch', { inputs });
  return response.data;
}

/**
 * Get token profile
 * @param {string} address - Token address
 * @param {string} chain - Chain (default: ethereum)
 */
export async function getTokenProfile(address, chain = 'ethereum') {
  const response = await api.get(`/api/tokens/${address}/profile`, {
    params: { chain }
  });
  return response.data;
}

/**
 * Get multiple token profiles
 * @param {string[]} addresses - Array of token addresses
 * @param {string} chain - Chain (default: ethereum)
 */
export async function getTokenProfilesBatch(addresses, chain = 'ethereum') {
  const response = await api.post('/api/tokens/profiles/batch', {
    addresses,
    chain
  });
  return response.data;
}

/**
 * Get trending tokens
 * @param {number} limit - Max number of tokens
 * @param {string} timeframe - 1h, 24h, or 7d
 */
export async function getTrendingTokens(limit = 10, timeframe = '24h') {
  const response = await api.get('/api/tokens/trending', {
    params: { limit, timeframe }
  });
  return response.data;
}

/**
 * Get indexer status for status banner
 */
export async function getIndexerStatus() {
  const response = await api.get('/api/resolve/indexer-status');
  return response.data;
}

/**
 * Get bootstrap queue status
 */
export async function getBootstrapQueue() {
  const response = await api.get('/api/resolve/bootstrap-queue');
  return response.data;
}
