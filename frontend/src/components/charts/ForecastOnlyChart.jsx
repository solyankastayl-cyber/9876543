/**
 * ForecastOnlyChart V3.11 (Unified Factory)
 * ==========================================
 * 
 * Renders synthetic forecast candles
 * Uses createTvChart() factory for identical behavior across all tabs
 * 
 * Features:
 * - Same zoom/drag/pinch as all other charts
 * - Volume toggle
 * - Outcomes toggle
 * - Quality/Drift/Position display
 */

import React, { useEffect, useRef, useState } from 'react';
import { createTvChart, TV_CANDLE_OPTIONS, TV_VOLUME_OPTIONS } from './tvChartPreset';
import QualityBadge from './QualityBadge';
import DriftIndicator from './DriftIndicator';
import PositionSizeDisplay from './PositionSizeDisplay';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Fetch forecast-only candles from backend
async function fetchForecastOnly(symbol, layer, horizon) {
  const url = `${API_URL}/api/market/forecast-only?symbol=${symbol}&layer=${layer}&horizon=${horizon}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  return res.json();
}

// V3.4: Fetch outcome markers
async function fetchOutcomes(symbol, layer, horizon) {
  const url = `${API_URL}/api/market/forecast-outcomes?symbol=${symbol}&layer=${layer}&horizon=${horizon}&limit=20`;
  const res = await fetch(url);
  if (!res.ok) return { outcomes: [] };
  return res.json();
}

export default function ForecastOnlyChart({
  symbol = 'BTC',
  layer = 'forecast',   // forecast | exchange | onchain | sentiment
  horizon = '7D',       // 1D | 7D | 30D
  height = 400,
  viewMode = 'candle',  // candle | line
  showOutcomes = true,  // V3.11: Controlled by parent (header buttons)
  showVolume = false,   // V3.11: Controlled by parent (header buttons)
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const latestRequestRef = useRef({ symbol: '', layer: '', horizon: '' }); // Track latest request params
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [outcomes, setOutcomes] = useState([]);

  // Fetch data when params change
  useEffect(() => {
    // Store current params to check for staleness
    const requestParams = { symbol, layer, horizon };
    latestRequestRef.current = requestParams;
    
    async function load() {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch forecast data
        const forecastUrl = `${API_URL}/api/market/forecast-only?symbol=${symbol}&layer=${layer}&horizon=${horizon}`;
        const outcomesUrl = `${API_URL}/api/market/forecast-outcomes?symbol=${symbol}&layer=${layer}&horizon=${horizon}&limit=20`;
        
        const [forecastRes, outcomesRes] = await Promise.all([
          fetch(forecastUrl),
          showOutcomes ? fetch(outcomesUrl) : Promise.resolve({ ok: true, json: () => Promise.resolve({ outcomes: [] }) }),
        ]);
        
        // Check if this request is still current (params match)
        const current = latestRequestRef.current;
        if (current.symbol !== requestParams.symbol || 
            current.layer !== requestParams.layer || 
            current.horizon !== requestParams.horizon) {
          return; // Stale request - ignore
        }
        
        if (!forecastRes.ok) throw new Error(`Failed to fetch: ${forecastRes.status}`);
        
        const forecastResult = await forecastRes.json();
        const outcomesResult = showOutcomes ? await outcomesRes.json() : { outcomes: [] };
        
        // Check again after parsing
        const currentAfterParse = latestRequestRef.current;
        if (currentAfterParse.symbol !== requestParams.symbol || 
            currentAfterParse.layer !== requestParams.layer || 
            currentAfterParse.horizon !== requestParams.horizon) {
          return; // Stale after parse - ignore
        }
        
        if (!forecastResult.ok) {
          throw new Error(forecastResult.message || 'API error');
        }
        
        setData(forecastResult);
        setOutcomes(outcomesResult.outcomes || []);
        setLoading(false);
      } catch (err) {
        console.error('[ForecastOnlyChart] Error:', err);
        setError(err.message);
        setLoading(false);
      }
    }

    load();
  }, [symbol, layer, horizon, showOutcomes]);

  // Render chart
  useEffect(() => {
    if (!containerRef.current || !data?.candles?.length) return;

    // Clear previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    // V3.11: Use unified factory (same zoom/drag across all tabs)
    const chart = createTvChart(containerRef.current);
    chart.applyOptions({
      width: containerRef.current.clientWidth,
      height,
    });

    chartRef.current = chart;

    // Determine colors based on direction
    const isUp = data.direction === 'UP';
    const lineColor = isUp ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)';

    // Prepare data
    const candleData = data.candles.map(c => ({
      time: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    
    const lineData = data.candles.map(c => ({
      time: c.time,
      value: c.close,
    }));

    // Add series based on viewMode (v4 API)
    let mainSeries;
    if (viewMode === 'line') {
      mainSeries = chart.addLineSeries({
        color: lineColor,
        lineWidth: 2,
        lastValueVisible: true,
        priceLineVisible: false,
      });
      mainSeries.setData(lineData);
    } else {
      mainSeries = chart.addCandlestickSeries(TV_CANDLE_OPTIONS);
      mainSeries.setData(candleData);
    }
    
    // Target price line
    if (data.targetPrice) {
      mainSeries.createPriceLine({
        price: data.targetPrice,
        color: 'rgba(100, 116, 139, 0.5)',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'Target',
      });
    }
      
    // V3.11: Outcome markers (controlled by toggle)
    if (showOutcomes && outcomes.length > 0) {
      const markers = outcomes.map(o => ({
        time: o.time,
        position: o.result === 'WIN' ? 'aboveBar' : 'belowBar',
        color: o.result === 'WIN' ? '#22c55e' : '#ef4444',
        shape: o.result === 'WIN' ? 'arrowUp' : 'arrowDown',
        text: o.result === 'WIN' ? '✔' : '✖',
      }));
      mainSeries.setMarkers(markers);
    } else {
      mainSeries.setMarkers([]);
    }

    // V3.11: Volume histogram (controlled by toggle) (v4 API)
    if (showVolume && data.volume?.length > 0) {
      const volumeSeries = chart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
        scaleMargins: { top: 0.85, bottom: 0 },
      });
      
      // Configure volume price scale
      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.85, bottom: 0 },
        borderVisible: false,
      });
      
      volumeSeries.setData(data.volume);
    }

    // V3.11: fitContent() - аккуратный стартовый масштаб
    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ 
          width: containerRef.current.clientWidth 
        });
        chartRef.current.timeScale().fitContent();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data, height, viewMode, showOutcomes, showVolume, outcomes]);

  // Loading state
  if (loading) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-50 rounded-xl"
        style={{ height }}
        data-testid="forecast-only-chart-loading"
      >
        <div className="text-gray-400">Loading forecast...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div 
        className="flex items-center justify-center bg-red-50 rounded-xl"
        style={{ height }}
        data-testid="forecast-only-chart-error"
      >
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  // No data
  if (!data?.candles?.length) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-50 rounded-xl"
        style={{ height }}
        data-testid="forecast-only-chart-empty"
      >
        <div className="text-gray-400">No forecast data</div>
      </div>
    );
  }

  // Derive action from direction (premium light colors)
  const action = data.direction === 'UP' ? 'BUY' : 'SELL';
  const actionColor = data.direction === 'UP' ? 'text-green-500' : 'text-red-500';

  return (
    <div className="relative">
      {/* Chart container - clean, no overlay */}
      <div 
        ref={containerRef}
        data-testid="forecast-only-chart"
        className="bg-white rounded-lg overflow-hidden border border-slate-200"
        style={{ height }}
      />

      {/* V3.11: VerdictPanel - premium light theme */}
      <div 
        className="mt-3 p-3 bg-white rounded-lg border border-slate-200"
        data-testid="verdict-panel"
      >
        {/* Top row: Action | Confidence | Position Size */}
        <div className="flex justify-between items-center">
          <div className={`text-lg font-semibold ${actionColor}`} data-testid="verdict-action">
            {action}
          </div>

          <div className="text-sm text-slate-500" data-testid="verdict-confidence">
            Confidence {((data.confidenceAdjustment?.adjusted || data.confidence || 0) * 100).toFixed(1)}%
          </div>

          <PositionSizeDisplay
            sizePct={data.positionSizing?.positionPct ?? 0}
            tier={data.positionSizing?.notionalHint}
          />
        </div>

        {/* Bottom row: Quality | Drift | Learning */}
        <div className="flex gap-3 mt-3">
          {data.quality && (
            <QualityBadge 
              state={data.quality.state}
              winRate={data.quality.winRate}
              rollingWinRate={data.quality.rollingWinRate}
            />
          )}
          {data.drift && (
            <DriftIndicator state={data.drift.state} />
          )}
        </div>
      </div>
    </div>
  );
}
