/**
 * SentimentForecastChart — BLOCK 5 UI
 * =====================================
 * 
 * Displays sentiment-based price forecast using lightweight-charts.
 * Uses the same TV preset as Exchange module for visual consistency.
 * 
 * Features:
 * - Projection candles based on expectedReturnPct
 * - Target price line
 * - Volume toggle (synthetic for now)
 * - Prepared for ghost overlay (Block 6)
 * 
 * API: 
 * - GET /api/sentiment/aggregate?symbol=<symbol>&window=<window>
 * - GET /api/market/candles?symbol=<symbol>USDT&range=7d (for current price)
 */

import React, { useEffect, useRef, useState } from 'react';
import { createTvChart, TV_CANDLE_OPTIONS } from './tvChartPreset';
import { RefreshCwIcon, BarChart3Icon, TrendingUpIcon, TrendingDownIcon, MinusIcon } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

function daysForWindow(w) {
  if (w === '24H') return 1;
  if (w === '7D') return 7;
  return 30;
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function genProjectionCandles(startPrice, expectedReturnPct, days, startDate) {
  const target = startPrice * (1 + expectedReturnPct);
  
  // Generate more candles for better visualization
  // 24H = 24 hourly candles, 7D = 28 (4 per day), 30D = 30 daily
  let N;
  let intervalMs;
  if (days === 1) {
    N = 24; // hourly candles
    intervalMs = 60 * 60 * 1000; // 1 hour
  } else if (days === 7) {
    N = 28; // 4 candles per day
    intervalMs = 6 * 60 * 60 * 1000; // 6 hours
  } else {
    N = days; // daily candles
    intervalMs = 24 * 60 * 60 * 1000; // 1 day
  }

  const candles = [];
  let prev = startPrice;

  // Market-like movement - slightly larger for visibility
  const maxDailyBody = 0.008; // 0.8%
  const maxWick = 0.003;      // 0.3%

  for (let i = 0; i < N; i++) {
    const t = new Date(startDate.getTime() + i * intervalMs);

    const progress = i / (N - 1);
    const anchor = startPrice + (target - startPrice) * progress;

    // Zigzag + small noise for realistic movement
    const zig = (i % 2 === 0 ? 1 : -1) * 0.4;
    const noise = (Math.random() - 0.5) * 0.3;
    const drifted = anchor * (1 + clamp((zig + noise) * 0.003, -0.006, 0.006));

    // Bridge correction: gently pull towards target
    const corrected = drifted * (1 + (target - drifted) / target * 0.35);

    const open = prev;
    let close = corrected;

    // Cap body
    const bodyPct = clamp((close - open) / open, -maxDailyBody, maxDailyBody);
    close = open * (1 + bodyPct);

    // Wicks
    const wickPct = clamp(Math.abs(bodyPct) * 0.4, 0.0005, maxWick);
    const high = Math.max(open, close) * (1 + wickPct);
    const low = Math.min(open, close) * (1 - wickPct);

    candles.push({
      time: Math.floor(t.getTime() / 1000),
      open,
      high,
      low,
      close,
    });

    prev = close;
  }

  // Guarantee target on last candle
  const last = candles[candles.length - 1];
  last.close = target;
  last.high = Math.max(last.high, target);
  last.low = Math.min(last.low, target);

  return { candles, target };
}

export default function SentimentForecastChart({
  symbol,
  windowKey,
  height = 360,
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  const [agg, setAgg] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [showVolume, setShowVolume] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch aggregate data
  useEffect(() => {
    let alive = true;
    setLoading(true);

    fetch(`${API_URL}/api/sentiment/aggregate?symbol=${symbol}&window=${windowKey}`)
      .then(r => r.json())
      .then(res => {
        if (!alive) return;
        if (res.ok && res.data) {
          setAgg(res.data);
        } else {
          setAgg(null);
        }
      })
      .catch(err => {
        if (!alive) return;
        console.error('[SentimentForecastChart] Aggregate error:', err);
        setAgg(null);
      });

    return () => {
      alive = false;
    };
  }, [symbol, windowKey]);

  // Fetch current price from candles endpoint
  useEffect(() => {
    let alive = true;

    // Use candles endpoint to get current price
    fetch(`${API_URL}/api/market/candles?symbol=${symbol}USDT&range=1d`)
      .then(r => r.json())
      .then(res => {
        if (!alive) return;
        if (res.ok && res.candles && res.candles.length > 0) {
          const lastCandle = res.candles[res.candles.length - 1];
          setCurrentPrice(lastCandle.close);
        } else {
          // Fallback: try without USDT suffix
          return fetch(`${API_URL}/api/market/candles?symbol=${symbol}&range=1d`)
            .then(r2 => r2.json())
            .then(res2 => {
              if (!alive) return;
              if (res2.ok && res2.candles && res2.candles.length > 0) {
                const lastCandle = res2.candles[res2.candles.length - 1];
                setCurrentPrice(lastCandle.close);
              } else {
                setCurrentPrice(null);
              }
            });
        }
      })
      .catch(err => {
        if (!alive) return;
        console.error('[SentimentForecastChart] Price error:', err);
        setCurrentPrice(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [symbol]);

  // No data state
  const hasData = agg && agg.eventsCount > 0 && currentPrice;

  // Initialize chart - run when hasData becomes true
  useEffect(() => {
    if (!containerRef.current) return;

    // Clean previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createTvChart(containerRef.current);
    chart.applyOptions({
      width: containerRef.current.clientWidth,
      height,
    });
    chartRef.current = chart;

    // Add candlestick series (v4 API)
    const candleSeries = chart.addCandlestickSeries(TV_CANDLE_OPTIONS);
    candleSeriesRef.current = candleSeries;

    // Add volume series (hidden by default) (v4 API)
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
      color: 'rgba(0, 0, 0, 0.08)',
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
      borderVisible: false,
    });
    volumeSeriesRef.current = volumeSeries;

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({
        width: containerRef.current.clientWidth,
        height,
      });
      chartRef.current.timeScale().fitContent();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [height, hasData]);

  // Update chart data when aggregate or price changes
  useEffect(() => {
    if (!candleSeriesRef.current || !chartRef.current) return;
    if (!agg || !currentPrice || !isFinite(currentPrice)) {
      candleSeriesRef.current.setData([]);
      if (volumeSeriesRef.current) volumeSeriesRef.current.setData([]);
      return;
    }

    const days = daysForWindow(agg.window);
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const { candles, target } = genProjectionCandles(
      currentPrice,
      agg.expectedReturnPct,
      days,
      start
    );

    candleSeriesRef.current.setData(candles);

    // Volume (synthetic)
    if (showVolume && volumeSeriesRef.current) {
      const vols = candles.map((c) => ({
        time: c.time,
        value: Math.round(1_000_000 * (0.6 + Math.random() * 0.8)),
        color: c.close >= c.open ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
      }));
      volumeSeriesRef.current.setData(vols);
    } else if (volumeSeriesRef.current) {
      volumeSeriesRef.current.setData([]);
    }

    // Target price line
    const formattedTarget = target.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    candleSeriesRef.current.createPriceLine({
      price: target,
      color: agg.direction === 'LONG' ? 'rgba(34, 197, 94, 0.6)' : 
             agg.direction === 'SHORT' ? 'rgba(239, 68, 68, 0.6)' : 
             'rgba(100, 116, 139, 0.5)',
      lineStyle: 2,
      lineWidth: 1,
      axisLabelVisible: true,
      title: `Target $${formattedTarget}`,
    });

    // Fit content with proper bar spacing based on number of candles
    chartRef.current.timeScale().fitContent();
    // Adjust bar spacing based on window
    const barSpacing = agg.window === '24H' ? 12 : agg.window === '7D' ? 8 : 6;
    chartRef.current.timeScale().applyOptions({ barSpacing });

  }, [agg, currentPrice, showVolume]);

  const getDirectionIcon = () => {
    if (!agg) return <MinusIcon className="w-4 h-4 text-gray-400" />;
    if (agg.direction === 'LONG') return <TrendingUpIcon className="w-4 h-4 text-emerald-500" />;
    if (agg.direction === 'SHORT') return <TrendingDownIcon className="w-4 h-4 text-red-500" />;
    return <MinusIcon className="w-4 h-4 text-gray-400" />;
  };

  const getDirectionColor = () => {
    if (!agg) return 'text-gray-500';
    if (agg.direction === 'LONG') return 'text-emerald-600';
    if (agg.direction === 'SHORT') return 'text-red-600';
    return 'text-gray-500';
  };

  // Loading state
  if (loading) {
    return (
      <div 
        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        data-testid="sentiment-forecast-loading"
      >
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <RefreshCwIcon className="w-4 h-4 text-gray-300 animate-spin" />
            <span className="text-sm text-gray-400">Loading forecast...</span>
          </div>
        </div>
        <div 
          className="flex items-center justify-center bg-gray-50"
          style={{ height }}
        >
          <div className="text-gray-300">Loading chart...</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
      data-testid="sentiment-forecast-chart"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getDirectionIcon()}
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {symbol} • SENTIMENT FORECAST
              </div>
              {hasData ? (
                <div className="text-xs text-gray-500 mt-0.5">
                  <span className={getDirectionColor()}>{agg.direction}</span>
                  {' • '}
                  Expected: <span className={agg.expectedReturnPct >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                    {agg.expectedReturnPct >= 0 ? '+' : ''}{(agg.expectedReturnPct * 100).toFixed(2)}%
                  </span>
                  {' • '}
                  Score: {(agg.score * 100).toFixed(0)}%
                </div>
              ) : (
                <div className="text-xs text-gray-400 mt-0.5">
                  No sentiment data for this symbol
                </div>
              )}
            </div>
          </div>
          
          {/* Volume Toggle */}
          <button
            onClick={() => setShowVolume(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showVolume
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            data-testid="sentiment-volume-toggle"
          >
            <BarChart3Icon className="w-3.5 h-3.5" />
            {showVolume ? 'Hide Volume' : 'Volume'}
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div 
        ref={containerRef} 
        style={{ 
          height, 
          width: '100%',
          display: hasData ? 'block' : 'none'
        }} 
      />
      
      {/* No data overlay */}
      {!hasData && (
        <div 
          className="flex items-center justify-center bg-gray-50"
          style={{ height }}
        >
          <div className="text-center">
            <MinusIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <div className="text-sm text-gray-500">No aggregate data yet</div>
            <div className="text-xs text-gray-400 mt-1">
              {currentPrice ? 'Waiting for sentiment events' : 'Price data unavailable'}
            </div>
          </div>
        </div>
      )}

      {/* Footer Stats */}
      {hasData && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between text-[10px] text-gray-500">
            <span>
              Based on {agg.eventsCount} event{agg.eventsCount !== 1 ? 's' : ''} • 
              Confidence: {(agg.confidence * 100).toFixed(0)}%
            </span>
            <span>
              Window: {windowKey} • 
              Current: ${currentPrice?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
