/**
 * TradingViewChart V3.1 — INDEPENDENT FORECAST OVERLAYS
 * 
 * ARCHITECTURE:
 * - Main chart = Real BTC candles (never changes)
 * - Prediction layer = Arrow marker only (no bars)
 * - Forecast/Exchange/etc = Each adds INDEPENDENT 2-bar overlay
 * 
 * Each forecast overlay:
 * - Bar 1: Current price (anchor)
 * - Bar 2: Forecast price (target)
 * - In Line mode: 2 points + line between them
 * 
 * All overlays are INDEPENDENT - can be dragged/scaled separately
 */

import { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';
import { LAYER_COLORS } from '../intelligence/ChartControlsBar';

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

function clampPct(pct, horizon) {
  if (horizon === '1D') return Math.max(Math.min(pct, 0.08), -0.08);
  if (horizon === '7D') return Math.max(Math.min(pct, 0.20), -0.20);
  if (horizon === '30D') return Math.max(Math.min(pct, 0.45), -0.45);
  return pct;
}

function getHorizonDays(horizon) {
  if (horizon === '1D') return 1;
  if (horizon === '7D') return 7;
  return 30;
}

function formatVolume(vol) {
  if (vol >= 1e9) return (vol / 1e9).toFixed(1) + 'B';
  if (vol >= 1e6) return (vol / 1e6).toFixed(1) + 'M';
  if (vol >= 1e3) return (vol / 1e3).toFixed(1) + 'K';
  return vol.toFixed(0);
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function TradingViewChartV2({
  candles = [],
  volume = [],
  outcomes = [],
  height = 480,
  theme = 'light',
  horizon = '1D',
  showVolume = true,
  showOutcomes = true,
  viewMode = 'candle',
  activeLayer = 'prediction',
  enabledLayers = new Set(['prediction']),
  forecastData = null,
  verdict = null,
  onCrosshairMove = null,
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  
  // Map of layer key -> series reference
  const forecastSeriesMapRef = useRef(new Map());
  
  const [tooltipData, setTooltipData] = useState(null);

  // Theme palette
  const palette = useMemo(() => {
    return theme === 'light' ? {
      background: '#ffffff',
      text: 'rgba(15, 23, 42, 0.9)',
      grid: 'rgba(15, 23, 42, 0.06)',
      border: 'rgba(15, 23, 42, 0.12)',
      upColor: '#22c55e',
      downColor: '#ef4444',
      volumeUp: 'rgba(34, 197, 94, 0.35)',
      volumeDown: 'rgba(239, 68, 68, 0.35)',
    } : {
      background: '#0f172a',
      text: 'rgba(241, 245, 249, 0.9)',
      grid: 'rgba(241, 245, 249, 0.06)',
      border: 'rgba(241, 245, 249, 0.12)',
      upColor: '#22c55e',
      downColor: '#ef4444',
      volumeUp: 'rgba(34, 197, 94, 0.35)',
      volumeDown: 'rgba(239, 68, 68, 0.35)',
    };
  }, [theme]);

  // ═══════════════════════════════════════════════════════════════
  // CHART INITIALIZATION
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!containerRef.current) return;

    const timeFormatter = (time) => {
      const date = new Date(time * 1000);
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      return `${month}/${day} ${hours}:${minutes}`;
    };

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { type: 'solid', color: palette.background },
        textColor: palette.text,
        fontFamily: "'Inter', -apple-system, sans-serif",
      },
      grid: {
        vertLines: { color: palette.grid },
        horzLines: { color: palette.grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(100, 100, 100, 0.4)', style: 2, width: 1 },
        horzLine: { color: 'rgba(100, 100, 100, 0.4)', style: 2, width: 1 },
      },
      rightPriceScale: {
        borderColor: palette.border,
        scaleMargins: { top: 0.15, bottom: 0.25 },
      },
      timeScale: {
        borderColor: palette.border,
        rightOffset: 10,
        barSpacing: 8,
        fixLeftEdge: false,
        fixRightEdge: false,
        rightBarStaysOnScroll: false,
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: timeFormatter,
      },
      localization: { timeFormatter },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    // Main candlestick series - ONLY real market data (v4 API)
    const candleSeries = chart.addCandlestickSeries({
      upColor: palette.upColor,
      downColor: palette.downColor,
      borderVisible: false,
      wickUpColor: palette.upColor,
      wickDownColor: palette.downColor,
    });

    // Volume histogram (v4 API)
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    // Crosshair handler
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point) {
        setTooltipData(null);
        return;
      }

      const candleData = param.seriesData?.get(candleSeries);
      const volumeData = param.seriesData?.get(volumeSeries);

      if (candleData) {
        setTooltipData({
          time: param.time,
          x: param.point.x,
          y: param.point.y,
          open: candleData.open,
          high: candleData.high,
          low: candleData.low,
          close: candleData.close,
          volume: volumeData?.value || 0,
        });
        onCrosshairMove?.({ time: param.time, price: candleData });
      }
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      // Cleanup all forecast series
      forecastSeriesMapRef.current.forEach(series => {
        try { chart.removeSeries(series); } catch (e) { /* ignore */ }
      });
      forecastSeriesMapRef.current.clear();
      chart.remove();
      chartRef.current = null;
    };
  }, [height, palette, onCrosshairMove]);

  // ═══════════════════════════════════════════════════════════════
  // UPDATE MARKET CANDLES (REAL DATA ONLY - NO FORECAST)
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!candleSeriesRef.current || !candles?.length) return;
    
    const sorted = [...candles].sort((a, b) => a.time - b.time);
    candleSeriesRef.current.setData(sorted);
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  // Update volume
  useEffect(() => {
    if (!volumeSeriesRef.current) return;
    
    if (volume?.length) {
      const sorted = [...volume].sort((a, b) => a.time - b.time);
      volumeSeriesRef.current.setData(sorted);
    } else if (candles?.length) {
      const volumeData = candles.map(c => ({
        time: c.time,
        value: c.volume || 0,
        color: c.close >= c.open ? palette.volumeUp : palette.volumeDown,
      }));
      volumeSeriesRef.current.setData(volumeData);
    }
  }, [volume, candles, palette]);

  // Toggle volume visibility
  useEffect(() => {
    if (!volumeSeriesRef.current) return;
    volumeSeriesRef.current.applyOptions({ visible: showVolume });
  }, [showVolume]);

  // ═══════════════════════════════════════════════════════════════
  // PREDICTION ARROW (on main candle series)
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!candleSeriesRef.current || !candles?.length) return;

    const markers = [];

    // Add outcome markers
    if (showOutcomes && outcomes?.length) {
      outcomes.forEach(o => {
        markers.push({
          time: o.time,
          position: o.win ? 'belowBar' : 'aboveBar',
          color: o.win ? palette.upColor : palette.downColor,
          shape: o.win ? 'arrowUp' : 'arrowDown',
          text: o.win ? 'W' : 'L',
        });
      });
    }

    // Add prediction arrow if "prediction" layer is active
    if (enabledLayers.has('prediction') && verdict && verdict.expectedReturn !== undefined) {
      const sorted = [...candles].sort((a, b) => a.time - b.time);
      const lastReal = sorted[sorted.length - 1];
      
      if (lastReal) {
        const rawPct = verdict.expectedReturn || 0;
        const expectedMovePct = clampPct(rawPct, horizon);
        const forecastPrice = lastReal.close * (1 + expectedMovePct);
        const pctDisplay = (expectedMovePct * 100).toFixed(1);
        const isUp = forecastPrice > lastReal.close;

        markers.push({
          time: lastReal.time,
          position: isUp ? 'aboveBar' : 'belowBar',
          color: isUp ? '#16a34a' : '#dc2626',
          shape: isUp ? 'arrowUp' : 'arrowDown',
          text: `${horizon} ${expectedMovePct > 0 ? '+' : ''}${pctDisplay}%`,
        });
      }
    }

    markers.sort((a, b) => a.time - b.time);
    candleSeriesRef.current.setMarkers(markers);

  }, [candles, verdict, horizon, outcomes, showOutcomes, palette, enabledLayers]);

  // ═══════════════════════════════════════════════════════════════
  // INDEPENDENT FORECAST OVERLAYS (2 bars/points each)
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!chartRef.current || !candles?.length) return;
    const chart = chartRef.current;

    // Get last real candle
    const sorted = [...candles].sort((a, b) => a.time - b.time);
    const lastReal = sorted[sorted.length - 1];
    if (!lastReal) return;

    // Calculate forecast data
    const rawPct = verdict?.expectedReturn || 0;
    const expectedMovePct = clampPct(rawPct, horizon);
    const forecastPrice = lastReal.close * (1 + expectedMovePct);
    const horizonDays = getHorizonDays(horizon);
    const forecastTime = lastReal.time + horizonDays * 24 * 60 * 60;

    // Forecast layers (not "prediction" - that's just arrow)
    const forecastLayers = ['forecast', 'exchange', 'onchain', 'sentiment'];

    // Process each forecast layer
    forecastLayers.forEach(layerKey => {
      const existingSeries = forecastSeriesMapRef.current.get(layerKey);
      const shouldBeActive = enabledLayers.has(layerKey);
      
      // Standard colors: green for UP, red for DOWN
      const isUp = verdict && verdict.expectedReturn >= 0;
      const barColor = isUp ? '#22c55e' : '#ef4444'; // green / red

      if (shouldBeActive && verdict && verdict.expectedReturn !== undefined) {
        // Create or update series
        if (existingSeries) {
          // Remove old series first
          try { chart.removeSeries(existingSeries); } catch (e) { /* ignore */ }
        }

        if (viewMode === 'candle') {
          // CANDLE MODE: 2 independent bars - same red/green as main chart (v4 API)
          const series = chart.addCandlestickSeries({
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderVisible: true,
            borderUpColor: '#22c55e',
            borderDownColor: '#ef4444',
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
            priceLineVisible: false,
            lastValueVisible: true,
          });

          // Calculate time for forecast bar
          const candleStep = lastReal.time - (sorted[sorted.length - 2]?.time || lastReal.time - 86400);
          const forecastBarTime = lastReal.time + candleStep;

          // Single solid bar from current price to forecast price (NO wicks)
          const barOpen = lastReal.close;
          const barClose = forecastPrice;
          const barHigh = Math.max(barOpen, barClose); // No extra margin
          const barLow = Math.min(barOpen, barClose);  // No extra margin

          series.setData([
            { time: forecastBarTime, open: barOpen, high: barHigh, low: barLow, close: barClose },
          ]);

          forecastSeriesMapRef.current.set(layerKey, series);

        } else {
          // LINE MODE: 2 points + line - green for UP, red for DOWN (v4 API)
          const lineColor = isUp ? '#22c55e' : '#ef4444';
          const series = chart.addLineSeries({
            color: lineColor,
            lineWidth: 3,
            priceLineVisible: false,
            lastValueVisible: true,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 6,
          });

          // Start line from 1 candle after last real
          const candleStep = lastReal.time - (sorted[sorted.length - 2]?.time || lastReal.time - 86400);
          const lineStartTime = lastReal.time + candleStep;

          series.setData([
            { time: lineStartTime, value: lastReal.close },
            { time: forecastTime, value: forecastPrice },
          ]);

          forecastSeriesMapRef.current.set(layerKey, series);
        }
      } else {
        // Remove series if layer is not active
        if (existingSeries) {
          try { chart.removeSeries(existingSeries); } catch (e) { /* ignore */ }
          forecastSeriesMapRef.current.delete(layerKey);
        }
      }
    });

    // Adjust right offset to show forecast
    const activeOverlays = forecastLayers.filter(l => enabledLayers.has(l)).length;
    if (activeOverlays > 0) {
      const rightOffset = horizon === '1D' ? 15 : horizon === '7D' ? 25 : 40;
      chart.timeScale().applyOptions({ rightOffset });
    } else {
      chart.timeScale().applyOptions({ rightOffset: 5 });
    }

  }, [candles, verdict, horizon, enabledLayers, viewMode]);

  // ═══════════════════════════════════════════════════════════════
  // TOOLTIP
  // ═══════════════════════════════════════════════════════════════
  const Tooltip = useCallback(() => {
    if (!tooltipData) return null;

    const { open, high, low, close, volume: vol } = tooltipData;
    const isUp = close >= open;
    const changePercent = ((close - open) / open * 100).toFixed(2);

    return (
      <div 
        className="absolute top-3 left-3 z-10 pointer-events-none"
        style={{
          backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(15,23,42,0.95)',
          border: `1px solid ${palette.border}`,
          borderRadius: '16px',
          padding: '12px 16px',
          fontSize: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          minWidth: '160px',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className={`font-bold ${isUp ? 'text-green-600' : 'text-red-600'}`}>
            ${close?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className={`text-xs ${isUp ? 'text-green-500' : 'text-red-500'}`}>
            {isUp ? '+' : ''}{changePercent}%
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs opacity-70">
          <span>O</span><span className="text-right">${open?.toLocaleString()}</span>
          <span>H</span><span className="text-right">${high?.toLocaleString()}</span>
          <span>L</span><span className="text-right">${low?.toLocaleString()}</span>
          <span>C</span><span className="text-right">${close?.toLocaleString()}</span>
          {vol > 0 && (
            <>
              <span>Vol</span>
              <span className="text-right">{formatVolume(vol)}</span>
            </>
          )}
        </div>
      </div>
    );
  }, [tooltipData, palette, theme]);

  return (
    <div className="relative w-full" style={{ height }} data-testid="tradingview-chart-v2">
      <div 
        ref={containerRef} 
        className="w-full h-full rounded-2xl overflow-hidden"
        style={{ 
          border: `1px solid ${palette.border}`,
          backgroundColor: palette.background,
        }}
      />
      <Tooltip />
    </div>
  );
}

export default TradingViewChartV2;
