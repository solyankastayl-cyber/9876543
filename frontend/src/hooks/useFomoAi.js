/**
 * FOMO AI Hook
 * 
 * Fetches and manages state for FOMO AI page:
 * - Final decision
 * - Chart data with verdicts
 * - Observability status
 */

import { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

export function useFomoAi(symbol) {
  const [decision, setDecision] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [observability, setObservability] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDecision = useCallback(async (time = null) => {
    try {
      const response = await fetch(`${API_BASE}/api/v10/decision/final`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, time }),
      });
      if (!response.ok) throw new Error('Failed to fetch decision');
      
      const data = await response.json();
      if (data.ok) {
        setDecision(data);
        setSelectedTime(data.timestamp || Date.now());
      }
    } catch (err) {
      console.error('[useFomoAi] Decision fetch failed:', err);
    }
  }, [symbol]);

  const fetchChartData = useCallback(async () => {
    try {
      // Fetch verdicts/chart data
      const response = await fetch(`${API_BASE}/api/v10/market/chart/${symbol}`);
      if (!response.ok) throw new Error('Failed to fetch chart');
      
      const data = await response.json();
      setChartData(data);
    } catch (err) {
      console.error('[useFomoAi] Chart fetch failed:', err);
      // Set empty chart data to prevent loading state
      setChartData({ price: [], verdicts: [], divergences: [] });
    }
  }, [symbol]);

  const fetchObservability = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v10/observability/status`);
      if (!response.ok) throw new Error('Failed to fetch observability');
      
      const data = await response.json();
      setObservability(data.data || data);
    } catch (err) {
      console.error('[useFomoAi] Observability fetch failed:', err);
      setObservability({ dataMode: 'LIVE', completeness: 1, staleness: 0 });
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchDecision(),
        fetchChartData(),
        fetchObservability(),
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchDecision, fetchChartData, fetchObservability]);

  const selectTime = useCallback((time) => {
    setSelectedTime(time);
    fetchDecision(time);
  }, [fetchDecision]);

  const refresh = useCallback(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    loadAll();
  }, [symbol]);

  return {
    decision,
    chartData,
    observability,
    selectedTime,
    selectTime,
    loading,
    error,
    refresh,
    setDecision, // Expose for WS updates
  };
}
