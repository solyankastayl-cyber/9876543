/**
 * BLOCK 76.1 — useConsensusPulse Hook
 * 
 * Fetches 7-day consensus pulse data for terminal header.
 * Shows consensus dynamics, structural lock events, divergence trends.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

/**
 * Sync state colors and labels
 */
export const SYNC_STATE_CONFIG = {
  ALIGNING: { color: '#16a34a', bg: '#dcfce7', label: 'Aligning' },
  DIVERGING: { color: '#dc2626', bg: '#fecaca', label: 'Diverging' },
  NEUTRAL: { color: '#6b7280', bg: '#f3f4f6', label: 'Neutral' },
  STRUCTURAL_DOMINANCE: { color: '#7c3aed', bg: '#ede9fe', label: 'Structure Lock' },
};

/**
 * Divergence grade colors
 */
export const DIVERGENCE_GRADE_CONFIG = {
  A: { color: '#16a34a', label: 'Excellent' },
  B: { color: '#22c55e', label: 'Good' },
  C: { color: '#eab308', label: 'Moderate' },
  D: { color: '#f97316', label: 'Poor' },
  F: { color: '#dc2626', label: 'Critical' },
};

/**
 * useConsensusPulse - Fetches 7-day consensus pulse data
 * 
 * @param {string} symbol - Trading symbol (BTC)
 * @param {number} days - Number of days (default: 7)
 * @returns {{ data, loading, error, refetch }}
 */
export function useConsensusPulse(symbol = 'BTC', days = 7) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  const cacheRef = useRef(null);

  const fetchPulse = useCallback(async () => {
    // Abort previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      // UNIFIED: SPX uses its own consensus endpoint
      const url = symbol === 'SPX'
        ? `${API_BASE}/api/fractal/spx/consensus`
        : `${API_BASE}/api/fractal/v2.1/consensus-pulse?symbol=${symbol}&days=${days}`;
      
      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.message || 'Unknown error');
      }

      // UNIFIED: Transform SPX consensus to pulse format
      let pulseData;
      if (symbol === 'SPX' && result.ok && result.consensus) {
        const c = result.consensus;
        pulseData = {
          ok: true,
          summary: {
            current: c.index ?? 50,
            delta7d: c.delta ?? 0,
            syncState: c.sync ?? 'NEUTRAL',
            avgStructuralWeight: c.structuralWeight ?? 50,
          },
          series: [{
            date: new Date().toISOString().split('T')[0],
            index: c.index ?? 50,
            divergenceGrade: c.divergenceGrade ?? 'C',
            divergenceScore: c.divergenceScore ?? 50,
          }],
        };
      } else {
        pulseData = result;
      }

      cacheRef.current = pulseData;
      setData(pulseData);
      setError(null);
    } catch (err) {
      if (err.name === 'AbortError') {
        return; // Ignore aborted requests
      }
      console.error('[useConsensusPulse] Error:', err);
      setError(err.message);
      // Use cached data if available
      if (cacheRef.current) {
        setData(cacheRef.current);
      }
    } finally {
      setLoading(false);
    }
  }, [symbol, days]);

  useEffect(() => {
    fetchPulse();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchPulse]);

  return { data, loading, error, refetch: fetchPulse };
}
