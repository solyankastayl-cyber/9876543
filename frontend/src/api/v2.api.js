/**
 * V2 API Client - P0 MULTICHAIN
 * 
 * Network-aware API endpoints for transfers, bridges, and wallet data.
 * All endpoints require `network` parameter (no defaults).
 */

import { api } from './client';

// ============================================
// TRANSFERS V2
// ============================================

/**
 * Get transfers (network REQUIRED)
 */
export async function getTransfersV2({ 
  network, 
  address, 
  direction = 'both',
  transferType = 'all',
  window = '7d', 
  limit = 100,
  cursor 
}) {
  if (!network) {
    throw new Error('NETWORK_REQUIRED: network parameter is required');
  }
  
  const params = new URLSearchParams({ network, window, limit: String(limit) });
  if (address) params.append('address', address);
  if (direction !== 'both') params.append('direction', direction);
  if (transferType !== 'all') params.append('transferType', transferType);
  if (cursor) params.append('cursor', cursor);
  
  const response = await api.get(`/api/v2/transfers?${params}`);
  return response.data;
}

/**
 * Get transfer summary for address (network REQUIRED)
 */
export async function getTransferSummaryV2({ network, address, window = '7d' }) {
  if (!network) {
    throw new Error('NETWORK_REQUIRED: network parameter is required');
  }
  if (!address) {
    throw new Error('ADDRESS_REQUIRED: address parameter is required');
  }
  
  const params = new URLSearchParams({ network, address, window });
  const response = await api.get(`/api/v2/transfers/summary?${params}`);
  return response.data;
}

// ============================================
// BRIDGES V2
// ============================================

/**
 * Get bridge events (network REQUIRED)
 */
export async function getBridgesV2({ 
  network, 
  address, 
  direction,
  window = '90d', 
  limit = 100 
}) {
  if (!network) {
    throw new Error('NETWORK_REQUIRED: network parameter is required');
  }
  
  const params = new URLSearchParams({ network, window, limit: String(limit) });
  if (address) params.append('address', address);
  if (direction) params.append('direction', direction);
  
  const response = await api.get(`/api/v2/bridges?${params}`);
  return response.data;
}

/**
 * Get bridge registry (known bridges)
 */
export async function getBridgeRegistry(network) {
  const params = network ? new URLSearchParams({ network }) : '';
  const response = await api.get(`/api/v2/bridges/registry${params ? '?' + params : ''}`);
  return response.data;
}

/**
 * Get bridge statistics (network REQUIRED)
 */
export async function getBridgeStats({ network, window = '7d' }) {
  if (!network) {
    throw new Error('NETWORK_REQUIRED: network parameter is required');
  }
  
  const params = new URLSearchParams({ network, window });
  const response = await api.get(`/api/v2/bridges/stats?${params}`);
  return response.data;
}

// ============================================
// WALLET V2
// ============================================

/**
 * Get wallet summary across networks
 * Supports network=all for multi-network view
 */
export async function getWalletSummaryV2({ address, network = 'all', window = '7d' }) {
  if (!address) {
    throw new Error('ADDRESS_REQUIRED: address parameter is required');
  }
  
  const params = new URLSearchParams({ address, window });
  if (network && network !== 'all') {
    params.append('network', network);
  }
  
  const response = await api.get(`/api/v2/wallet/summary?${params}`);
  return response.data;
}

/**
 * Get wallet activity timeline (network REQUIRED)
 */
export async function getWalletTimelineV2({ network, address, window = '7d', limit = 50 }) {
  if (!network) {
    throw new Error('NETWORK_REQUIRED: network parameter is required');
  }
  if (!address) {
    throw new Error('ADDRESS_REQUIRED: address parameter is required');
  }
  
  const params = new URLSearchParams({ network, address, window, limit: String(limit) });
  const response = await api.get(`/api/v2/wallet/timeline?${params}`);
  return response.data;
}

/**
 * Get top counterparties (network REQUIRED)
 */
export async function getWalletCounterpartiesV2({ 
  network, 
  address, 
  direction,
  window = '30d', 
  limit = 20 
}) {
  if (!network) {
    throw new Error('NETWORK_REQUIRED: network parameter is required');
  }
  if (!address) {
    throw new Error('ADDRESS_REQUIRED: address parameter is required');
  }
  
  const params = new URLSearchParams({ network, address, window, limit: String(limit) });
  if (direction) params.append('direction', direction);
  
  const response = await api.get(`/api/v2/wallet/counterparties?${params}`);
  return response.data;
}

// ============================================
// NETWORKS
// ============================================

/**
 * Get list of supported networks
 */
export async function getSupportedNetworks() {
  const response = await api.get('/api/networks');
  return response.data;
}

export default {
  // Transfers
  getTransfersV2,
  getTransferSummaryV2,
  // Bridges
  getBridgesV2,
  getBridgeRegistry,
  getBridgeStats,
  // Wallet
  getWalletSummaryV2,
  getWalletTimelineV2,
  getWalletCounterpartiesV2,
  // Networks
  getSupportedNetworks,
};
