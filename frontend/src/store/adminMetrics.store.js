/**
 * Admin Metrics Store - STEP 0.5
 * 
 * Zustand store for cached metrics.
 */

import { create } from 'zustand';

export const useAdminMetricsStore = create((set, get) => ({
  // Metrics data
  metrics: null,
  loading: false,
  error: null,
  lastFetch: null,
  
  // Actions
  setMetrics: (data) => set({ 
    metrics: data, 
    loading: false,
    lastFetch: Date.now(),
    error: null,
  }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error, loading: false }),
  
  // Invalidate (triggers refetch)
  invalidate: () => set({ metrics: null }),
  
  // Check if stale (older than 2 minutes)
  isStale: () => {
    const { lastFetch } = get();
    if (!lastFetch) return true;
    return Date.now() - lastFetch > 2 * 60 * 1000;
  },
  
  // Reset
  reset: () => set({ metrics: null, loading: false, error: null }),
}));
