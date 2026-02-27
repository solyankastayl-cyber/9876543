/**
 * Smart Money API - B4 Smart Money Profile endpoints
 */
import { api } from './client';

/**
 * Get wallet's smart money profile
 * @param {string} walletAddress - Wallet address
 * @param {string} chain - Chain name
 */
export const getWalletSmartProfile = async (walletAddress, chain = 'Ethereum') => {
  const response = await api.get(`/api/wallets/${walletAddress}/smart-profile`, {
    params: { chain },
  });
  return response.data;
};

/**
 * Force recalculate smart money profile
 * @param {string} walletAddress - Wallet address
 * @param {string} chain - Chain name
 */
export const calculateWalletSmartProfile = async (walletAddress, chain = 'Ethereum') => {
  const response = await api.post(`/api/wallets/${walletAddress}/smart-profile/calculate`, {
    chain,
  });
  return response.data;
};

/**
 * Get cluster's smart money profile
 * @param {string} clusterId - Cluster ID
 */
export const getClusterSmartProfile = async (clusterId) => {
  const response = await api.get(`/api/clusters/${clusterId}/smart-profile`);
  return response.data;
};

/**
 * Get top smart money performers
 * @param {number} limit - Max results
 * @param {string} minLabel - Minimum label (emerging/proven/elite)
 */
export const getTopSmartMoney = async (limit = 10, minLabel = 'proven') => {
  const response = await api.get('/api/smart-money/top', {
    params: { limit, minLabel },
  });
  return response.data;
};

/**
 * Get smart money summary for multiple wallets
 * @param {string[]} addresses - Wallet addresses
 */
export const getSmartMoneySummary = async (addresses) => {
  const response = await api.post('/api/smart-money/summary', {
    addresses,
  });
  return response.data;
};

/**
 * Get smart money context for alert group
 * @param {string} groupId - Alert group ID
 */
export const getAlertSmartMoneyContext = async (groupId) => {
  const response = await api.get(`/api/alerts/groups/${groupId}/smart-money`);
  return response.data;
};
