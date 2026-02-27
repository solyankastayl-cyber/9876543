/**
 * Admin State Store - STEP 0.5
 * 
 * Zustand store for fast admin state.
 */

import { create } from 'zustand';

export const useAdminStateStore = create((set, get) => ({
  // State data
  state: null,
  loading: false,
  error: null,
  lastFetch: null,
  
  // Actions
  setState: (data) => set({ 
    state: data, 
    lastFetch: Date.now(),
    error: null,
  }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error, loading: false }),
  
  // Partial update (for WS invalidation)
  updateSystemState: (system) => set((s) => ({
    state: s.state ? { ...s.state, system } : null,
  })),
  
  updateMLState: (ml) => set((s) => ({
    state: s.state ? { ...s.state, ml } : null,
  })),
  
  updateProvidersState: (providers) => set((s) => ({
    state: s.state ? { ...s.state, providers } : null,
  })),
  
  updateRetrainState: (retrain) => set((s) => ({
    state: s.state ? { ...s.state, retrain } : null,
  })),
  
  // Reset
  reset: () => set({ state: null, loading: false, error: null }),
}));
