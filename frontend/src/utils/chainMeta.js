/**
 * Chain Metadata (P2.3.3 BLOCK 1)
 * 
 * Metadata for all supported chains
 */

export interface ChainMetadata {
  name: string;
  shortName: string;
  chainId: number | string;
  nativeToken: string;
  explorer: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const CHAIN_METADATA: Record<string, ChainMetadata> = {
  ETH: {
    name: 'Ethereum',
    shortName: 'ETH',
    chainId: 1,
    nativeToken: 'ETH',
    explorer: 'https://etherscan.io',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  ARB: {
    name: 'Arbitrum',
    shortName: 'ARB',
    chainId: 42161,
    nativeToken: 'ETH',
    explorer: 'https://arbiscan.io',
    color: 'text-sky-700',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200'
  },
  OP: {
    name: 'Optimism',
    shortName: 'OP',
    chainId: 10,
    nativeToken: 'ETH',
    explorer: 'https://optimistic.etherscan.io',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  BASE: {
    name: 'Base',
    shortName: 'BASE',
    chainId: 8453,
    nativeToken: 'ETH',
    explorer: 'https://basescan.org',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200'
  },
  POLY: {
    name: 'Polygon',
    shortName: 'POLY',
    chainId: 137,
    nativeToken: 'MATIC',
    explorer: 'https://polygonscan.com',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  BNB: {
    name: 'BNB Chain',
    shortName: 'BNB',
    chainId: 56,
    nativeToken: 'BNB',
    explorer: 'https://bscscan.com',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  AVAX: {
    name: 'Avalanche',
    shortName: 'AVAX',
    chainId: 43114,
    nativeToken: 'AVAX',
    explorer: 'https://snowtrace.io',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  ZKSYNC: {
    name: 'zkSync Era',
    shortName: 'ZK',
    chainId: 324,
    nativeToken: 'ETH',
    explorer: 'https://explorer.zksync.io',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  },
  SCROLL: {
    name: 'Scroll',
    shortName: 'SCROLL',
    chainId: 534352,
    nativeToken: 'ETH',
    explorer: 'https://scrollscan.com',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  LINEA: {
    name: 'Linea',
    shortName: 'LINEA',
    chainId: 59144,
    nativeToken: 'ETH',
    explorer: 'https://lineascan.build',
    color: 'text-teal-700',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200'
  }
};

/**
 * Get chain metadata by chain code
 */
export function getChainMeta(chain: string): ChainMetadata {
  return CHAIN_METADATA[chain.toUpperCase()] || {
    name: chain,
    shortName: chain,
    chainId: 0,
    nativeToken: '',
    explorer: '',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  };
}

/**
 * Get all supported chains
 */
export function getAllChains(): string[] {
  return Object.keys(CHAIN_METADATA);
}
