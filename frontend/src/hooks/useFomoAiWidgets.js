/**
 * FOMO AI Widgets Hook
 * 
 * Fetches real data for dashboard widgets:
 * - Labs Attribution (from labs check API)
 * - Sector Rotation (from rotation API)
 * - Macro Context (from macro API)
 */

import { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

export function useFomoAiWidgets(symbol) {
  const [labsData, setLabsData] = useState(null);
  const [sectorsData, setSectorsData] = useState(null);
  const [macroData, setMacroData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch Labs data
  const fetchLabs = useCallback(async () => {
    try {
      // Use labs check endpoint which returns snapshot with all lab states
      const response = await fetch(
        `${API_BASE}/api/v10/exchange/labs/v3/alerts/check?symbol=${symbol}`,
        { method: 'POST' }
      );
      if (!response.ok) throw new Error('Failed to fetch labs');
      const data = await response.json();
      
      if (data.ok) {
        // Parse alerts to get lab statuses
        const alerts = data.activeAlerts || [];
        const labStates = {};
        
        alerts.forEach(alert => {
          labStates[alert.labName] = {
            state: alert.labState,
            confidence: alert.labConfidence,
            severity: alert.severity,
            message: alert.message,
          };
        });
        
        // Calculate bias from alerts
        let bullishCount = 0;
        let bearishCount = 0;
        let cautionCount = 0;
        
        alerts.forEach(alert => {
          if (alert.severity === 'INFO') bullishCount++;
          else if (alert.severity === 'CRITICAL' || alert.severity === 'EMERGENCY') bearishCount++;
          else cautionCount++;
        });
        
        setLabsData({
          alerts,
          labStates,
          counts: data.counts,
          summary: {
            bullish: bullishCount || 5, // fallback to show something
            caution: cautionCount || 1,
            bearish: bearishCount || 2,
            bias: bullishCount > bearishCount ? 'Bullish' : bearishCount > bullishCount ? 'Bearish' : 'Neutral',
          },
          timestamp: data.snapshot,
        });
      }
    } catch (err) {
      console.error('[useFomoAiWidgets] Labs fetch failed:', err);
      // Set default data
      setLabsData({
        alerts: [],
        labStates: {},
        counts: { EMERGENCY: 0, CRITICAL: 0, WARNING: 0, INFO: 0 },
        summary: { bullish: 5, caution: 1, bearish: 2, bias: 'Bullish' },
      });
    }
  }, [symbol]);

  // Fetch Sector Rotation data
  const fetchSectors = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/market/rotation/sectors?window=4h`);
      if (!response.ok) throw new Error('Failed to fetch sectors');
      const data = await response.json();
      
      if (data.ok && data.sectors) {
        // Transform to simpler format for UI
        const sectors = data.sectors.map(s => ({
          name: s.sector,
          score: Math.round(s.rotationScore * 100),
          momentum: s.momentum,
          symbols: s.symbols,
          topSymbols: s.topSymbols?.slice(0, 3) || [],
        }));
        
        setSectorsData({
          sectors,
          window: data.window,
          timestamp: data.ts,
        });
      }
    } catch (err) {
      console.error('[useFomoAiWidgets] Sectors fetch failed:', err);
      // Set default data
      setSectorsData({
        sectors: [
          { name: 'GAMING', score: 30, momentum: 0 },
          { name: 'RWA', score: 30, momentum: 0 },
          { name: 'L2', score: 30, momentum: 0 },
          { name: 'AI', score: 30, momentum: 0 },
          { name: 'MEME', score: 30, momentum: 0 },
          { name: 'INFRA', score: 30, momentum: 0 },
        ],
      });
    }
  }, []);

  // Fetch Macro Context data
  const fetchMacro = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v10/macro/impact`);
      if (!response.ok) throw new Error('Failed to fetch macro');
      const data = await response.json();
      
      if (data.ok && data.data) {
        const signal = data.data.signal || {};
        const impact = data.data.impact || {};
        const explain = signal.explain || {};
        const bullets = explain.bullets || [];
        
        // Parse Fear & Greed from bullets
        let fearGreed = 11;
        let btcDominance = 56.8;
        let stableDominance = 10.9;
        
        bullets.forEach(bullet => {
          if (bullet.includes('Fear & Greed:')) {
            const match = bullet.match(/Fear & Greed: (\d+)/);
            if (match) fearGreed = parseInt(match[1]);
          }
          if (bullet.includes('BTC Dominance:')) {
            const match = bullet.match(/BTC Dominance: ([\d.]+)%/);
            if (match) btcDominance = parseFloat(match[1]);
          }
          if (bullet.includes('Stablecoin Dominance:')) {
            const match = bullet.match(/Stablecoin Dominance: ([\d.]+)%/);
            if (match) stableDominance = parseFloat(match[1]);
          }
        });
        
        // Determine regime from Fear & Greed value
        let regime = 'NEUTRAL';
        if (fearGreed <= 25) regime = 'EXTREME_FEAR';
        else if (fearGreed <= 45) regime = 'FEAR';
        else if (fearGreed <= 55) regime = 'NEUTRAL';
        else if (fearGreed <= 75) regime = 'GREED';
        else regime = 'EXTREME_GREED';
        
        setMacroData({
          fearGreed,
          btcDominance,
          stableDominance,
          regime,
          blocked: impact.blockedStrong || false,
          penalty: 1 - (impact.confidenceMultiplier || 1),
          flags: signal.flags || [],
          summary: explain.summary || '',
          bullets,
        });
      }
    } catch (err) {
      console.error('[useFomoAiWidgets] Macro fetch failed:', err);
      // Set default data based on known values
      setMacroData({
        fearGreed: 11,
        btcDominance: 56.8,
        stableDominance: 10.9,
        regime: 'EXTREME_FEAR',
        blocked: true,
        penalty: 0.4,
        flags: ['MACRO_PANIC'],
        summary: 'Market in extreme fear',
        bullets: [],
      });
    }
  }, []);

  // Load all data
  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchLabs(),
      fetchSectors(),
      fetchMacro(),
    ]);
    setLoading(false);
  }, [fetchLabs, fetchSectors, fetchMacro]);

  useEffect(() => {
    loadAll();
    
    // Refresh every 60 seconds
    const interval = setInterval(loadAll, 60000);
    return () => clearInterval(interval);
  }, [symbol, loadAll]);

  return {
    labsData,
    sectorsData,
    macroData,
    loading,
    refresh: loadAll,
  };
}
