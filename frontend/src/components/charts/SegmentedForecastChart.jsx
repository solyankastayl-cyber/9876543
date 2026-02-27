/**
 * BLOCK 6.2 — Segmented Forecast Chart
 * =====================================
 * 
 * Renders real ML prediction segments (not synthetic bridges).
 * 
 * Key features:
 * - Multiple segment series on one chart
 * - ACTIVE segment: full color
 * - SUPERSEDED segments: gray/faded (25% opacity)
 * - Shows ML model evolution over time
 * - No redrawing of past predictions
 * 
 * This is real institutional-grade forecast visualization.
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createTvChart, TV_CANDLE_OPTIONS } from './tvChartPreset';
import { fetchExchangeSegments, fetchSegmentCandles } from '../../api/exchangeSegments.api';

// ═══════════════════════════════════════════════════════════════
// CANDLE STYLE OPTIONS
// ═══════════════════════════════════════════════════════════════

// ACTIVE segment - full color
const ACTIVE_CANDLE_OPTIONS = {
  upColor: 'rgba(34, 197, 94, 0.75)',
  downColor: 'rgba(239, 68, 68, 0.75)',
  wickUpColor: 'rgba(34, 197, 94, 0.90)',
  wickDownColor: 'rgba(239, 68, 68, 0.90)',
  borderVisible: false,
  lastValueVisible: true,
  priceLineVisible: false,
};

// SUPERSEDED segment - gray/faded
const SUPERSEDED_CANDLE_OPTIONS = {
  upColor: 'rgba(148, 163, 184, 0.20)',
  downColor: 'rgba(148, 163, 184, 0.20)',
  wickUpColor: 'rgba(148, 163, 184, 0.30)',
  wickDownColor: 'rgba(148, 163, 184, 0.30)',
  borderVisible: false,
  lastValueVisible: false,
  priceLineVisible: false,
};

// RESOLVED segment - based on outcome
const RESOLVED_WIN_OPTIONS = {
  upColor: 'rgba(34, 197, 94, 0.30)',
  downColor: 'rgba(34, 197, 94, 0.30)',
  wickUpColor: 'rgba(34, 197, 94, 0.40)',
  wickDownColor: 'rgba(34, 197, 94, 0.40)',
  borderVisible: false,
  lastValueVisible: false,
  priceLineVisible: false,
};

const RESOLVED_LOSS_OPTIONS = {
  upColor: 'rgba(239, 68, 68, 0.25)',
  downColor: 'rgba(239, 68, 68, 0.25)',
  wickUpColor: 'rgba(239, 68, 68, 0.35)',
  wickDownColor: 'rgba(239, 68, 68, 0.35)',
  borderVisible: false,
  lastValueVisible: false,
  priceLineVisible: false,
};

function getCandleOptionsForSegment(segment) {
  if (segment.status === 'ACTIVE') {
    return ACTIVE_CANDLE_OPTIONS;
  }
  
  if (segment.status === 'RESOLVED') {
    if (segment.outcome === 'WIN') return RESOLVED_WIN_OPTIONS;
    if (segment.outcome === 'LOSS') return RESOLVED_LOSS_OPTIONS;
    return SUPERSEDED_CANDLE_OPTIONS;
  }
  
  // SUPERSEDED
  return SUPERSEDED_CANDLE_OPTIONS;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function SegmentedForecastChart({
  asset = 'BTC',
  horizon = '30D',
  height = 400,
  showModelInfo = true,
  onSegmentChange = null,
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const segmentSeriesRef = useRef([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [segments, setSegments] = useState([]);
  const [activeSegment, setActiveSegment] = useState(null);

  // Fetch segments when params change
  useEffect(() => {
    let cancelled = false;

    async function loadSegments() {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchExchangeSegments({ asset, horizon });

        if (cancelled) return;

        if (!result.ok) {
          throw new Error(result.message || 'Failed to fetch segments');
        }

        const items = result.data?.items || [];
        setSegments(items);
        
        const active = items.find(s => s.status === 'ACTIVE');
        setActiveSegment(active || null);
        
        if (onSegmentChange && active) {
          onSegmentChange(active);
        }

        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          console.error('[SegmentedChart] Error:', err);
          setError(err.message);
          setLoading(false);
        }
      }
    }

    loadSegments();

    return () => {
      cancelled = true;
    };
  }, [asset, horizon]);

  // Render chart with segments
  useEffect(() => {
    if (!containerRef.current || loading || error) return;

    // Clear previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }
    segmentSeriesRef.current = [];

    // Create new chart
    const chart = createTvChart(containerRef.current);
    chart.applyOptions({
      width: containerRef.current.clientWidth,
      height,
    });
    chartRef.current = chart;

    // Load candles for each segment
    async function renderSegments() {
      // Sort: old first, active last (so active renders on top)
      const sortedSegments = [...segments].sort((a, b) => {
        if (a.status === 'ACTIVE') return 1;
        if (b.status === 'ACTIVE') return -1;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      for (const segment of sortedSegments) {
        try {
          // Fetch candles for this segment
          const candlesResult = await fetchSegmentCandles(segment.segmentId);
          
          if (!candlesResult.ok || !candlesResult.data?.candles?.length) {
            console.warn(`[SegmentedChart] No candles for ${segment.segmentId}`);
            continue;
          }

          const candles = candlesResult.data.candles;
          const options = getCandleOptionsForSegment(segment);

          // Add series (v4 API)
          const series = chart.addCandlestickSeries(options);
          series.setData(candles);
          segmentSeriesRef.current.push(series);

          // Add target price line for active segment
          if (segment.status === 'ACTIVE' && segment.targetPrice) {
            series.createPriceLine({
              price: segment.targetPrice,
              color: 'rgba(100, 116, 139, 0.5)',
              lineWidth: 1,
              lineStyle: 2,
              axisLabelVisible: true,
              title: 'Target',
            });
          }

          // Add entry price line for active segment
          if (segment.status === 'ACTIVE' && segment.entryPrice) {
            series.createPriceLine({
              price: segment.entryPrice,
              color: 'rgba(59, 130, 246, 0.4)',
              lineWidth: 1,
              lineStyle: 1,
              axisLabelVisible: true,
              title: 'Entry',
            });
          }
        } catch (err) {
          console.error(`[SegmentedChart] Error loading segment ${segment.segmentId}:`, err);
        }
      }

      // Fit content after all series loaded
      chart.timeScale().fitContent();
    }

    renderSegments();

    // Handle resize
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
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
      segmentSeriesRef.current = [];
    };
  }, [segments, loading, error, height]);

  // Loading state
  if (loading) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-xl"
        style={{ height }}
        data-testid="segmented-forecast-chart-loading"
      >
        <div className="text-gray-400">Loading segments...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="flex items-center justify-center bg-red-50 rounded-xl"
        style={{ height }}
        data-testid="segmented-forecast-chart-error"
      >
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  // No segments
  if (!segments.length) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-xl"
        style={{ height }}
        data-testid="segmented-forecast-chart-empty"
      >
        <div className="text-gray-400">No forecast segments available</div>
      </div>
    );
  }

  // Derive action from active segment
  const action = activeSegment?.expectedReturn > 0 ? 'BUY' : 'SELL';
  const actionColor = action === 'BUY' ? 'text-green-500' : 'text-red-500';
  const expectedPct = activeSegment?.expectedReturn ? (activeSegment.expectedReturn * 100).toFixed(2) : '0.00';

  return (
    <div className="relative">
      {/* Chart container */}
      <div
        ref={containerRef}
        data-testid="segmented-forecast-chart"
        className="bg-white rounded-lg overflow-hidden border border-slate-200"
        style={{ height }}
      />

      {/* Model Info Panel */}
      {showModelInfo && activeSegment && (
        <div
          className="mt-3 p-3 bg-white rounded-lg border border-slate-200"
          data-testid="segment-info-panel"
        >
          {/* Top row: Action | Expected Return | Confidence */}
          <div className="flex justify-between items-center">
            <div className={`text-lg font-semibold ${actionColor}`} data-testid="segment-action">
              {action}
            </div>

            <div className="text-sm text-slate-600" data-testid="segment-expected-return">
              Expected: {expectedPct}%
            </div>

            <div className="text-sm text-slate-500" data-testid="segment-confidence">
              Confidence: {((activeSegment.confidence || 0) * 100).toFixed(1)}%
            </div>
          </div>

          {/* Bottom row: Model Version | Created | Bias */}
          <div className="flex gap-4 mt-2 text-xs text-slate-400">
            <div data-testid="segment-model-version">
              Model: {activeSegment.modelVersion}
            </div>
            <div data-testid="segment-created-at">
              Updated: {new Date(activeSegment.createdAt).toLocaleDateString()}
            </div>
            {activeSegment.biasApplied !== 0 && (
              <div data-testid="segment-bias">
                Bias: {(activeSegment.biasApplied * 100).toFixed(1)}%
              </div>
            )}
            {activeSegment.driftState && activeSegment.driftState !== 'NORMAL' && (
              <div className={activeSegment.driftState === 'WARNING' ? 'text-yellow-500' : 'text-red-500'}>
                Drift: {activeSegment.driftState}
              </div>
            )}
          </div>

          {/* Segment stats */}
          <div className="flex gap-2 mt-2 text-xs">
            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
              Active: 1
            </span>
            {segments.filter(s => s.status === 'SUPERSEDED').length > 0 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                History: {segments.filter(s => s.status === 'SUPERSEDED').length}
              </span>
            )}
            {segments.filter(s => s.status === 'RESOLVED').length > 0 && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded">
                Resolved: {segments.filter(s => s.status === 'RESOLVED').length}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
