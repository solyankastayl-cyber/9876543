/**
 * Wallets API - B1 Wallet Profile + B2 Token Correlation endpoints
 */
import { api } from './client';

/**
 * Get wallet profile by address
 * @param {string} address - Wallet address
 * @param {string} chain - Chain name (default: Ethereum)
 */
export const getProfile = async (address, chain = 'Ethereum') => {
  const response = await api.get(`/wallets/${address}`, {
    params: { chain },
  });
  return response.data;
};

/**
 * Build or refresh wallet profile
 * @param {Object} data - Raw wallet data including transactions
 */
export const buildProfile = async (data) => {
  const response = await api.post('/wallets/profile', data);
  return response.data;
};

/**
 * Search wallets by tags
 * @param {string[]} tags - Array of tags to filter by
 * @param {number} limit - Max results
 */
export const searchByTags = async (tags, limit = 50) => {
  const response = await api.get('/wallets/search', {
    params: { 
      tags: tags.join(','),
      limit,
    },
  });
  return response.data;
};

/**
 * Get high-volume wallets
 * @param {number} limit - Max results
 */
export const getHighVolumeWallets = async (limit = 20) => {
  const response = await api.get('/wallets/high-volume', {
    params: { limit },
  });
  return response.data;
};

/**
 * Get available wallet tags
 */
export const getTags = async () => {
  const response = await api.get('/wallets/tags');
  return response.data;
};

// ========== B2: Token Correlation APIs ==========

/**
 * Get wallets driving activity on a token
 * @param {string} tokenAddress - Token address
 * @param {string} chain - Chain name
 * @param {number} limit - Max drivers to return
 */
export const getTokenDrivers = async (tokenAddress, chain = 'Ethereum', limit = 5) => {
  const response = await api.get(`/api/market/token-drivers/${tokenAddress}`, {
    params: { chain, limit },
  });
  return response.data;
};

/**
 * Trigger fresh correlation calculation for a token
 * @param {string} tokenAddress - Token address
 * @param {string} chain - Chain name
 * @param {number} windowHours - Analysis window in hours
 */
export const calculateTokenDrivers = async (tokenAddress, chain = 'Ethereum', windowHours = 24) => {
  const response = await api.post(`/api/tokens/${tokenAddress}/drivers/calculate`, {
    chain,
    windowHours,
  });
  return response.data;
};

/**
 * Get tokens where a wallet has influence
 * @param {string} walletAddress - Wallet address
 * @param {number} limit - Max results
 */
export const getWalletTokenInfluence = async (walletAddress, limit = 10) => {
  const response = await api.get(`/api/wallets/${walletAddress}/token-influence`, {
    params: { limit },
  });
  return response.data;
};

/**
 * Get wallet drivers for an alert group
 * @param {string} groupId - Alert group ID
 */
export const getAlertGroupDrivers = async (groupId) => {
  const response = await api.get(`/api/alerts/groups/${groupId}/drivers`);
  return response.data;
};

/**
 * Link drivers to an alert group
 * @param {string} groupId - Alert group ID
 * @param {string} tokenAddress - Token address
 * @param {string} chain - Chain name
 */
export const linkAlertGroupDrivers = async (groupId, tokenAddress, chain = 'Ethereum') => {
  const response = await api.post(`/api/alerts/groups/${groupId}/drivers/link`, {
    tokenAddress,
    chain,
  });
  return response.data;
};
