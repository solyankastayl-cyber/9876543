/**
 * Market API Client (Phase 15.5.2 - Extended)
 */
import { api } from './client';

/**
 * Get market context for an asset (exploration mode)
 * @param {string} asset - Asset address or symbol
 * @param {string} chain - Chain (default: ethereum)
 */
export async function getMarketContext(asset, chain = 'ethereum') {
  const response = await api.get(`/api/market/context/${asset}`, {
    params: { chain }
  });
  return response.data;
}

/**
 * Get token activity snapshot from indexed transfers
 * CRITICAL: This is the source of truth for Activity Snapshot block
 * @param {string} tokenAddress - Token contract address
 * @param {string} window - Time window (1h, 6h, 24h)
 */
export async function getTokenActivity(tokenAddress, window = '24h') {
  const response = await api.get(`/api/market/token-activity/${tokenAddress}`, {
    params: { window }
  });
  return response.data;
}

/**
 * Get latest price for an asset
 * @param {string} asset - Asset address
 * @param {string} chain - Chain (default: ethereum)
 */
export async function getLatestPrice(asset, chain = 'ethereum') {
  const response = await api.get(`/api/market/prices/${asset}/latest`, {
    params: { chain }
  });
  return response.data;
}

/**
 * Get market metrics for an asset
 * @param {string} asset - Asset address
 * @param {string} window - Time window (1h, 4h, 24h, 7d)
 */
export async function getMarketMetrics(asset, window = '24h') {
  const response = await api.get(`/api/market/market-metrics/${asset}`, {
    params: { window }
  });
  return response.data;
}

/**
 * Get known tokens
 * @param {string} chain - Chain (default: ethereum)
 */
export async function getKnownTokens(chain = 'ethereum') {
  const response = await api.get('/api/market/known-tokens', {
    params: { chain }
  });
  return response.data;
}

/**
 * Get top active tokens by transfer count (Market Discovery)
 * @param {number} limit - Number of tokens to return
 * @param {string} window - Time window (1h, 6h, 24h)
 */
export async function getTopActiveTokens(limit = 10, window = '24h') {
  const response = await api.get('/api/market/top-active-tokens', {
    params: { limit, window }
  });
  return response.data;
}

/**
 * Get flow anomalies (z-score deviations) for market analysis
 * @param {string} asset - Asset address (default: ETH)
 * @param {string} chain - Chain (default: ethereum)
 * @param {string} timeframe - Time window (7d, 14d, 30d)
 */
export async function getFlowAnomalies(asset = '0x0000000000000000000000000000000000000000', chain = 'ethereum', timeframe = '7d') {
  const response = await api.get('/api/market/flow-anomalies', {
    params: { asset, chain, timeframe }
  });
  return response.data;
}

/**
 * Get tokens with emerging signals (Discovery Layer)
 * @param {number} limit - Number of tokens to return
 */
export async function getEmergingSignals(limit = 10) {
  const response = await api.get('/api/market/emerging-signals', {
    params: { limit }
  });
  return response.data;
}

/**
 * Get new active actors/wallets (Discovery Layer)
 * @param {number} limit - Number of actors to return
 */
export async function getNewActors(limit = 10) {
  const response = await api.get('/api/market/new-actors', {
    params: { limit }
  });
  return response.data;
}

/**
 * Get market narratives - агрегированные факты более высокого порядка
 * @param {string} window - Time window (6h, 24h)
 * @param {number} limit - Maximum narratives to return (1-10)
 */
export async function getNarratives(window = '24h', limit = 5) {
  const response = await api.get('/api/market/narratives', {
    params: { window, limit }
  });
  return response.data;
}

/**
 * Get narratives grouped by sector (PART 2 - Sector Aggregation)
 * @param {string} window - Time window (6h, 24h)
 */
export async function getNarrativesBySector(window = '24h') {
  const response = await api.get('/api/market/narratives-by-sector', {
    params: { window }
  });
  return response.data;
}
