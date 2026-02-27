/**
 * useFractalOverlay — Fetches fractal overlay data for Replay mode
 * FIXED: Now includes horizonDays in the request key
 * UNIFIED: Supports both BTC and SPX assets with different endpoints
 */
import { useEffect, useState, useCallback } from "react";

// Map focus string to days
const focusToDays = (focus) => {
  const match = focus?.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 30;
};

export function useFractalOverlay(symbol, focus = '30d') {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [selectedMatchId, setSelectedMatchId] = useState(null);

  const API_URL = process.env.REACT_APP_BACKEND_URL || '';
  const horizonDays = focusToDays(focus);

  // Reset selected match when horizon changes
  useEffect(() => {
    setSelectedMatchId(null);
  }, [horizonDays]);

  // Fetch overlay data
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(null);

    let url;
    
    if (symbol === 'SPX') {
      // SPX uses unified endpoint that returns matches in FractalSignalContract format
      url = `${API_URL}/api/fractal/spx?focus=${focus}`;
    } else if (symbol === 'DXY') {
      // DXY uses its own isolated endpoint
      url = `${API_URL}/api/fractal/dxy?focus=${focus}`;
    } else {
      // BTC uses legacy overlay endpoint
      const matchWindowLen = Math.min(90, Math.max(30, horizonDays));
      const displayWindowLen = horizonDays;
      url = `${API_URL}/api/fractal/v2.1/overlay?symbol=${encodeURIComponent(symbol)}&horizon=${horizonDays}&windowLen=${matchWindowLen}&displayWindow=${displayWindowLen}&topK=10&aftermathDays=${horizonDays}`;
    }

    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error(`overlay ${r.status}`);
        return await r.json();
      })
      .then((json) => {
        if (!alive) return;
        
        // UNIFIED: Transform SPX/DXY response to match BTC overlay format
        let overlayData;
        if ((symbol === 'SPX' || symbol === 'DXY') && json.ok && json.data) {
          // SPX/DXY returns { ok, data: FractalSignalContract }
          const assetData = json.data;
          
          // DXY: replay is array with windowNormalized/aftermathNormalized
          // SPX: matches come from explain.topMatches
          let matches;
          let currentWindowNormalized = [];
          
          if (symbol === 'DXY' && Array.isArray(assetData.replay) && assetData.replay.length > 0) {
            // DXY replay format: array of {windowNormalized, aftermathNormalized, similarity, startDate, endDate}
            matches = assetData.replay.map((r, idx) => ({
              id: r.startDate ? `${r.startDate}_${r.endDate}` : `match_${idx}`,
              startDate: r.startDate,
              date: r.startDate,
              endDate: r.endDate,
              similarity: r.similarity || 1,
              phase: 'NEUTRAL',
              return: 0,
              windowNormalized: r.windowNormalized || [],
              aftermathNormalized: r.aftermathNormalized || [],
            }));
            // Use first match window as current window
            currentWindowNormalized = assetData.replay[0]?.windowNormalized || [];
          } else {
            // SPX format
            matches = (assetData.explain?.topMatches || assetData.matches || []).map(m => ({
              id: m.id || m.startDate,
              startDate: m.date || m.startDate || m.id,
              date: m.date || m.startDate || m.id,
              similarity: m.similarity > 1 ? m.similarity / 100 : m.similarity,
              phase: m.phase,
              return: m.return > 1 ? m.return / 100 : m.return,
              return7d: (m.return7d || 0) > 1 ? (m.return7d || 0) / 100 : (m.return7d || 0),
              return14d: (m.return14d || 0) > 1 ? (m.return14d || 0) / 100 : (m.return14d || 0),
              return30d: (m.return || 0) > 1 ? (m.return || 0) / 100 : (m.return || 0),
              maxDrawdown: (m.maxDrawdown || 0) > 1 ? (m.maxDrawdown || 0) / 100 : (m.maxDrawdown || 0),
              maxExcursion: (m.maxExcursion || 0) > 1 ? (m.maxExcursion || 0) / 100 : (m.maxExcursion || 0),
              windowNormalized: m.windowNormalized || [],
              aftermathNormalized: m.aftermathNormalized || [],
            }));
            currentWindowNormalized = assetData.chartData?.currentWindow?.normalized || [];
          }
          
          overlayData = {
            matches,
            windowLen: currentWindowNormalized.length || 60,
            stats: {
              matchCount: matches.length,
              avgSimilarity: matches.length > 0 
                ? matches.reduce((sum, m) => sum + (m.similarity || 0), 0) / matches.length
                : 0,
            },
            currentWindow: { 
              raw: currentWindowNormalized, 
              normalized: currentWindowNormalized 
            },
            distributionSeries: assetData.bands || { p10: [], p25: [], p50: [], p75: [], p90: [] },
          };
        } else {
          // BTC format - use as-is
          overlayData = json;
        }
        
        setData(overlayData);
        
        // Auto-select first match if none selected or current doesn't exist
        if (overlayData?.matches?.length) {
          const stillExists = selectedMatchId && overlayData.matches.some(m => m.id === selectedMatchId);
          if (!stillExists) {
            setSelectedMatchId(overlayData.matches[0].id);
          }
        }
      })
      .catch((e) => {
        if (!alive) return;
        setErr(e?.message ?? "overlay fetch failed");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [symbol, horizonDays, API_URL]);

  // Get match index by ID
  const matchIndex = data?.matches?.findIndex(m => m.id === selectedMatchId) ?? 0;
  
  // Select match handler
  const selectMatch = useCallback((id) => {
    setSelectedMatchId(id);
  }, []);

  return { 
    data, 
    loading, 
    err, 
    horizonDays,
    selectedMatchId,
    matchIndex: Math.max(0, matchIndex),
    selectMatch,
    setMatchIndex: (idx) => {
      if (data?.matches?.[idx]) {
        setSelectedMatchId(data.matches[idx].id);
      }
    }
  };
}
