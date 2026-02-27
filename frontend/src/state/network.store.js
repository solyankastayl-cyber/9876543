/**
 * Network Store - ETAP B1
 * 
 * Global network context for the entire application.
 * Network selector controls ALL data: graphs, actors, tokens, etc.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// Supported Networks
// ============================================

export const SUPPORTED_NETWORKS = [
  { id: 'ethereum', name: 'Ethereum', shortName: 'ETH', chainId: 1, color: '#627EEA' },
  { id: 'arbitrum', name: 'Arbitrum', shortName: 'ARB', chainId: 42161, color: '#28A0F0' },
  { id: 'optimism', name: 'Optimism', shortName: 'OP', chainId: 10, color: '#FF0420' },
  { id: 'base', name: 'Base', shortName: 'BASE', chainId: 8453, color: '#0052FF' },
  { id: 'polygon', name: 'Polygon', shortName: 'MATIC', chainId: 137, color: '#8247E5' },
];

export const DEFAULT_NETWORK = 'ethereum';

// ============================================
// Store
// ============================================

const useNetworkStore = create(
  persist(
    (set, get) => ({
      // ============================================
      // State
      // ============================================
      
      /** Current selected network */
      network: DEFAULT_NETWORK,
      
      /** Loading state during network switch */
      switching: false,
      
      // ============================================
      // Actions
      // ============================================
      
      /**
       * Set network and trigger data refresh
       */
      setNetwork: (network) => {
        const current = get().network;
        if (current === network) return;
        
        console.log(`[NetworkStore] Switching from ${current} to ${network}`);
        
        set({ 
          network, 
          switching: true 
        });
        
        // Clear switching flag after a brief delay
        setTimeout(() => {
          set({ switching: false });
        }, 100);
      },
      
      /**
       * Get current network config
       */
      getNetworkConfig: () => {
        const { network } = get();
        return SUPPORTED_NETWORKS.find(n => n.id === network) || SUPPORTED_NETWORKS[0];
      },
      
      /**
       * Check if network is valid
       */
      isValidNetwork: (network) => {
        return SUPPORTED_NETWORKS.some(n => n.id === network);
      },
    }),
    {
      name: 'fomo-network',
      partialize: (state) => ({ network: state.network }),
    }
  )
);

export default useNetworkStore;
