/**
 * PHASE 2 — useFractalTerminal Hook
 * 
 * Single hook for entire terminal data:
 * - chart
 * - overlay
 * - horizonMatrix
 * - structure
 * - resolver
 */

import { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

export function useFractalTerminal(symbol = 'BTC', set = 'extended', focus = '30d') {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = `${API_BASE}/api/fractal/v2.1/terminal?symbol=${symbol}&set=${set}&focus=${focus}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();
      
      if (json.error) {
        throw new Error(json.error);
      }

      setData(json);
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [symbol, set, focus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    // Destructured for convenience
    chart: data?.chart,
    overlay: data?.overlay,
    horizonMatrix: data?.horizonMatrix,
    structure: data?.structure,
    resolver: data?.resolver,
    volatility: data?.volatility,
    decisionKernel: data?.decisionKernel,
    meta: data?.meta,
  };
}

export default useFractalTerminal;
