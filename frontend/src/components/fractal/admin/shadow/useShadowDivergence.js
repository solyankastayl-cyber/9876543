/**
 * BLOCK 57.2 — Shadow Divergence Data Hook
 * 
 * Single fetch → local filtering.
 * One payload fills entire page.
 */

import { useEffect, useState, useCallback, useMemo } from 'react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';
const REFRESH_INTERVAL = 60000; // 60 seconds

export function useShadowDivergence(symbol = 'BTC') {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/fractal/v2.1/admin/shadow-divergence?symbol=${symbol}`
      );
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const json = await res.json();
      
      if (json.error) {
        throw new Error(json.message || 'API Error');
      }
      
      setData(json);
      setError(null);
      setLastFetch(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto refresh
  useEffect(() => {
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, loading, error, lastFetch, refetch: fetchData };
}

/**
 * Helper: Extract cell data for selected preset + horizon
 */
export function useCellData(data, preset, horizonKey) {
  return useMemo(() => {
    if (!data?.summary?.[preset]?.[horizonKey]) {
      return null;
    }

    const cell = data.summary[preset][horizonKey];
    const equity = data.equity?.[preset]?.[horizonKey];
    const calibration = data.calibration?.[preset]?.[horizonKey];

    return {
      active: cell.active,
      shadow: cell.shadow,
      delta: cell.delta,
      equity,
      calibration
    };
  }, [data, preset, horizonKey]);
}

/**
 * Helper: Filter ledger by preset/horizon
 */
export function useFilteredLedger(data, preset, horizon) {
  return useMemo(() => {
    if (!data?.divergenceLedger) return [];
    
    return data.divergenceLedger.filter(row => {
      const matchPreset = !preset || row.preset === preset;
      const matchHorizon = !horizon || row.horizon === `${horizon}d`;
      return matchPreset && matchHorizon;
    });
  }, [data, preset, horizon]);
}
