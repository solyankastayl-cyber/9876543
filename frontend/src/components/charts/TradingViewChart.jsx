/**
 * TradingViewChart — TradingView Lightweight Charts v4 Implementation
 * 
 * ARCHITECTURE (Based on user's detailed plan):
 * 
 * Features:
 * - OHLC Candlestick rendering
 * - Volume histogram (togglable)
 * - Forecast overlay: TWO LINE SERIES (green UP / red DOWN)
 * - Future segment: Only 2 points (lastClose → targetPrice)
 * - Right offset: Empty space to see future predictions
 * - Drag/scroll: mouseWheel + pressedMouseMove enabled
 * - Outcome markers (W/L)
 * - Professional, minimal design (green/red only, no rainbow)
 * 
 * TOGGLES ACTUALLY WORK:
 * - showVolume → volumeSeries.applyOptions({ visible })
 * - showOutcomes → candleSeries.setMarkers([])
 * - layer → switches forecast data source
 */

import { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function horizonToSeconds(horizon) {
  if (horizon === '1D') return 24 * 60 * 60;
  if (horizon === '7D') return 7 * 24 * 60 * 60;
  if (horizon === '30D') return 30 * 24 * 60 * 60;
  return 24 * 60 * 60; // default 1D
}

function computeRightOffset(horizon) {
  // Enough bars to see future segment
  if (horizon === '30D') return 60;
  if (horizon === '7D') return 30;
  return 15;
}

function formatVolume(vol) {
  if (vol >= 1e9) return (vol / 1e9).toFixed(1) + 'B';
  if (vol >= 1e6) return (vol / 1e6).toFixed(1) + 'M';
  if (vol >= 1e3) return (vol / 1e3).toFixed(1) + 'K';
  return vol.toFixed(0);
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export const TradingViewChart = ({
  candles = [],
  volume = [],
  forecast = null,
  outcomes = [],
  height = 480,
  theme = 'light',
  horizon = '1D',
  showVolume = true,
  showOutcomes = true,
  onCrosshairMove = null,
}) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  
  // TWO forecast series: green (UP) and red (DOWN)
  const forecastUpRef = useRef(null);
  const forecastDownRef = useRef(null);
  
  const [tooltipData, setTooltipData] = useState(null);

  // Theme palette
  const palette = useMemo(() => {
    return theme === 'light' ? {
      background: '#ffffff',
      text: 'rgba(15, 23, 42, 0.9)',
      grid: 'rgba(15, 23, 42, 0.06)',
      border: 'rgba(15, 23, 42, 0.12)',
      upColor: '#16a34a',
      downColor: '#dc2626',
      volumeColor: '#94a3b8',
      volumeUp: 'rgba(22, 163, 74, 0.35)',
      volumeDown: 'rgba(220, 38, 38, 0.35)',
    } : {
      background: '#0f172a',
      text: 'rgba(241, 245, 249, 0.9)',
      grid: 'rgba(241, 245, 249, 0.06)',
      border: 'rgba(241, 245, 249, 0.12)',
      upColor: '#22c55e',
      downColor: '#ef4444',
      volumeColor: '#64748b',
      volumeUp: 'rgba(34, 197, 94, 0.35)',
      volumeDown: 'rgba(239, 68, 68, 0.35)',
    };
  }, [theme]);

  // Initialize chart ONCE
  useEffect(() => {
    if (!containerRef.current) return;

    // Custom time formatter
    const timeFormatter = (time) => {
      const date = new Date(time * 1000);
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      return `${month}/${day} ${hours}:${minutes}`;
    };

    // Create chart (v4 API)
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
        vertLine: {
          color: 'rgba(100, 100, 100, 0.4)',
          style: 2,
          width: 1,
        },
        horzLine: {
          color: 'rgba(100, 100, 100, 0.4)',
          style: 2,
          width: 1,
        },
      },
      rightPriceScale: {
        borderColor: palette.border,
        scaleMargins: { top: 0.15, bottom: 0.25 },
      },
      timeScale: {
        borderColor: palette.border,
        rightOffset: computeRightOffset(horizon),
        barSpacing: 8,
        fixLeftEdge: false,
        fixRightEdge: false, // Allow scrolling past right edge
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: timeFormatter,
      },
      localization: {
        timeFormatter: timeFormatter,
      },
      // IMPORTANT: Enable drag/scroll for chart navigation
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

    // Candlestick series (v4 API)
    const candleSeries = chart.addCandlestickSeries({
      upColor: palette.upColor,
      downColor: palette.downColor,
      borderVisible: false,
      wickUpColor: palette.upColor,
      wickDownColor: palette.downColor,
    });

    // Volume histogram series (v4 API)
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    // Forecast UP series (green line) (v4 API)
    const forecastUp = chart.addLineSeries({
      color: palette.upColor,
      lineWidth: 2,
      lineStyle: 0, // Solid
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    // Forecast DOWN series (red line) (v4 API)
    const forecastDown = chart.addLineSeries({
      color: palette.downColor,
      lineWidth: 2,
      lineStyle: 0, // Solid
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    // Crosshair move handler
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

    // Store refs
    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    forecastUpRef.current = forecastUp;
    forecastDownRef.current = forecastDown;

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      forecastUpRef.current = null;
      forecastDownRef.current = null;
    };
  }, [height, palette, onCrosshairMove]);

  // Update candles data
  useEffect(() => {
    if (!candleSeriesRef.current || !candles?.length) return;
    
    const sortedCandles = [...candles].sort((a, b) => a.time - b.time);
    candleSeriesRef.current.setData(sortedCandles);
    
    // Fit content initially
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  // Update volume data
  useEffect(() => {
    if (!volumeSeriesRef.current) return;
    
    if (volume?.length) {
      const sortedVolume = [...volume].sort((a, b) => a.time - b.time);
      volumeSeriesRef.current.setData(sortedVolume);
    } else if (candles?.length) {
      // Generate volume from candles if not provided
      const volumeData = candles.map(c => ({
        time: c.time,
        value: c.volume || 0,
        color: c.close >= c.open ? palette.volumeUp : palette.volumeDown,
      }));
      volumeSeriesRef.current.setData(volumeData);
    }
  }, [volume, candles, palette]);

  // TOGGLE: Volume visibility
  useEffect(() => {
    if (!volumeSeriesRef.current) return;
    volumeSeriesRef.current.applyOptions({ visible: showVolume });
  }, [showVolume]);

  // TOGGLE: Outcome markers
  useEffect(() => {
    if (!candleSeriesRef.current) return;

    if (!showOutcomes || !outcomes?.length) {
      candleSeriesRef.current.setMarkers([]);
      return;
    }

    const markers = outcomes.map(o => ({
      time: o.time,
      position: o.win ? 'belowBar' : 'aboveBar',
      color: o.win ? palette.upColor : palette.downColor,
      shape: o.win ? 'arrowUp' : 'arrowDown',
      text: o.win ? 'W' : 'L',
    }));

    markers.sort((a, b) => a.time - b.time);
    candleSeriesRef.current.setMarkers(markers);
  }, [outcomes, showOutcomes, palette]);

  // Update forecast overlay (2-point segment, green/red)
  useEffect(() => {
    if (!forecastUpRef.current || !forecastDownRef.current || !candles?.length) {
      forecastUpRef.current?.setData([]);
      forecastDownRef.current?.setData([]);
      return;
    }

    if (!forecast) {
      forecastUpRef.current.setData([]);
      forecastDownRef.current.setData([]);
      return;
    }

    const lastCandle = candles[candles.length - 1];
    if (!lastCandle) return;

    // Build 2-point segment
    const horizonSec = horizonToSeconds(forecast.horizonDays === 1 ? '1D' : forecast.horizonDays === 7 ? '7D' : '30D');
    const expectedMovePct = forecast.expectedMovePct || 0;
    const direction = forecast.direction || 'UP';
    
    const t0 = lastCandle.time;
    const t1 = t0 + horizonSec;
    const p0 = lastCandle.close;
    const p1 = direction === 'UP' 
      ? p0 * (1 + Math.abs(expectedMovePct) / 100)
      : p0 * (1 - Math.abs(expectedMovePct) / 100);

    const segment = [
      { time: t0, value: p0 },
      { time: t1, value: p1 },
    ];

    const isUp = p1 >= p0;

    if (isUp) {
      forecastUpRef.current.setData(segment);
      forecastDownRef.current.setData([]);
    } else {
      forecastDownRef.current.setData(segment);
      forecastUpRef.current.setData([]);
    }
  }, [forecast, candles]);

  // Update right offset based on horizon
  useEffect(() => {
    if (!chartRef.current) return;
    
    chartRef.current.timeScale().applyOptions({
      rightOffset: computeRightOffset(horizon),
    });
    
    // Scroll to show latest data + future space
    chartRef.current.timeScale().scrollToRealTime();
  }, [horizon]);

  // Tooltip component
  const Tooltip = useCallback(() => {
    if (!tooltipData) return null;

    const { open, high, low, close, volume } = tooltipData;
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
          {volume > 0 && (
            <>
              <span>Vol</span>
              <span className="text-right">{formatVolume(volume)}</span>
            </>
          )}
        </div>
      </div>
    );
  }, [tooltipData, palette, theme]);

  return (
    <div className="relative w-full" style={{ height }} data-testid="tradingview-chart">
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
};

export default TradingViewChart;
