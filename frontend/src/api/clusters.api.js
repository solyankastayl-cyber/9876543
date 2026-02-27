/**
 * Clusters API - B3 Wallet Clusters endpoints
 */
import { api } from './client';

/**
 * Get clusters for a wallet
 * @param {string} walletAddress - Wallet address
 */
export const getWalletClusters = async (walletAddress) => {
  const response = await api.get(`/api/wallets/${walletAddress}/clusters`);
  return response.data;
};

/**
 * Analyze and find related wallets
 * @param {string} walletAddress - Wallet address
 * @param {string} chain - Chain name
 */
export const analyzeWalletClusters = async (walletAddress, chain = 'Ethereum') => {
  const response = await api.post(`/api/wallets/${walletAddress}/clusters/analyze`, {
    chain,
  });
  return response.data;
};

/**
 * Get cluster by ID
 * @param {string} clusterId - Cluster ID
 */
export const getCluster = async (clusterId) => {
  const response = await api.get(`/api/clusters/${clusterId}`);
  return response.data;
};

/**
 * Get cluster for review (detailed evidence)
 * @param {string} clusterId - Cluster ID
 */
export const getClusterReview = async (clusterId) => {
  const response = await api.get(`/api/clusters/${clusterId}/review`);
  return response.data;
};

/**
 * Confirm a cluster relationship
 * @param {string} clusterId - Cluster ID
 * @param {string} notes - Optional notes
 */
export const confirmCluster = async (clusterId, notes) => {
  const response = await api.post(`/api/clusters/${clusterId}/confirm`, {
    notes,
  });
  return response.data;
};

/**
 * Reject a cluster relationship
 * @param {string} clusterId - Cluster ID
 * @param {string} notes - Optional notes
 */
export const rejectCluster = async (clusterId, notes) => {
  const response = await api.post(`/api/clusters/${clusterId}/reject`, {
    notes,
  });
  return response.data;
};
