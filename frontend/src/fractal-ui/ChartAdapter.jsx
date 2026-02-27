/**
 * CHART ADAPTER — Universal wrapper for existing chart components
 * 
 * Outside: Unified contract (candles, nav, continuation, bands)
 * Inside: Existing FractalMainChart/FractalHybridChart
 * 
 * This adapter allows FractalShell to use existing charts
 * without any modifications to the chart internals.
 * 
 * MEMOIZED to prevent re-renders on hover/polling
 */

import React, { useMemo, memo } from 'react';
import { FractalMainChart } from '../components/fractal/chart/FractalMainChart';
import { FractalHybridChart } from '../components/fractal/chart/FractalHybridChart';
import { FractalOverlaySection } from '../components/fractal/sections/FractalOverlaySection';
import { FRACTAL_MODES } from '../platform.contracts';
import { theme } from '../core/theme';

// FIXED CHART HEIGHT for layout stability
const CHART_HEIGHT = 460;
const CHART_WIDTH = 1100;

/**
 * ChartAdapter Props:
 * @param {object} chartPack - Unified chart data contract
 * @param {object} focusPack - Focus-specific data from useFocusPack
 * @param {string} mode - 'synthetic' | 'replay' | 'hybrid' | 'adjusted'
 * @param {string} assetId - 'btc' | 'spx' | 'dxy'
 * @param {string} focus - '7d' | '14d' | '30d' | '90d' | '180d' | '365d'
 * @param {number} width - Chart width
 * @param {number} height - Chart height
 * @param {string} viewMode - 'ABS' | 'PERCENT' (for SPX)
 * @param {function} onPhaseFilter - Callback for phase filtering
 */
export const ChartAdapter = memo(function ChartAdapter({
  chartPack,
  focusPack,
  mode = FRACTAL_MODES.SYNTHETIC,
  assetId = 'btc',
  focus = '30d',
  width = CHART_WIDTH,
  height = CHART_HEIGHT,
  viewMode = 'ABS',
  onPhaseFilter,
}) {
  // Convert assetId to symbol format expected by existing charts
  const symbol = assetId.toUpperCase();
  
  // Build focusPack-like structure from chartPack if needed
  const enhancedFocusPack = useMemo(() => {
    if (focusPack) return focusPack;
    if (!chartPack) return null;
    
    // Convert chartPack to focusPack format for legacy charts
    return {
      meta: {
        symbol,
        focus,
        horizon: parseInt(focus.replace('d', ''), 10),
        aftermathDays: parseInt(focus.replace('d', ''), 10),
      },
      forecast: {
        path: chartPack.continuation || [],
        upperBand: chartPack.bands?.p90 || [],
        lowerBand: chartPack.bands?.p10 || [],
        currentPrice: chartPack.candles?.[chartPack.candles.length - 1]?.c || 0,
      },
      overlay: {
        matches: [],
        stats: {},
        distributionSeries: chartPack.bands || {},
      },
    };
  }, [chartPack, focusPack, symbol, focus]);
  
  // No data - show placeholder
  if (!enhancedFocusPack && !chartPack) {
    return (
      <div 
        style={{ 
          width, 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: theme.section,
          borderRadius: 12,
        }}
        data-testid="chart-placeholder"
      >
        <div style={{ color: theme.textMuted }}>No chart data available</div>
      </div>
    );
  }
  
  // Render based on mode
  switch (mode) {
    case FRACTAL_MODES.SYNTHETIC:
    case FRACTAL_MODES.ADJUSTED:
      // Both use FractalMainChart (Adjusted shows same chart with different panels)
      return (
        <FractalMainChart
          symbol={symbol}
          width={width}
          height={height}
          focus={focus}
          focusPack={enhancedFocusPack}
          viewMode={viewMode}
        />
      );
    
    case FRACTAL_MODES.REPLAY:
      return (
        <FractalOverlaySection
          symbol={symbol}
          focus={focus}
          focusPack={enhancedFocusPack}
        />
      );
    
    case FRACTAL_MODES.HYBRID:
      return (
        <FractalHybridChart
          symbol={symbol}
          width={width}
          height={height}
          focus={focus}
          focusPack={enhancedFocusPack}
          onPhaseFilter={onPhaseFilter}
          viewMode={viewMode}
        />
      );
    
    default:
      return (
        <FractalMainChart
          symbol={symbol}
          width={width}
          height={height}
          focus={focus}
          focusPack={enhancedFocusPack}
          viewMode={viewMode}
        />
      );
  }
}

/**
 * ChartWrapper — Simplified wrapper for render prop usage
 * 
 * Used by FractalShell:
 *   <FractalShell 
 *     renderChart={(props) => <ChartWrapper {...props} />}
 *   />
 */
export function ChartWrapper({ data, mode, config, focus }) {
  if (!data) return null;
  
  return (
    <ChartAdapter
      chartPack={data?.chart}
      focusPack={data}
      mode={mode}
      assetId={config?.id || 'btc'}
      focus={focus}
      width={1100}
      height={460}
    />
  );
}

export default ChartAdapter;
