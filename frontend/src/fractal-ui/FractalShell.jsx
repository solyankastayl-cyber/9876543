/**
 * FRACTAL SHELL — Universal wrapper for asset pages
 * 
 * This is THE key component of the adaptive architecture.
 * 
 * ONE Shell serves:
 * - BTC
 * - SPX  
 * - DXY
 * 
 * Shell responsibilities:
 * - Load data via useFocusPack (existing hook)
 * - Manage modes (Synthetic/Replay/Hybrid/Adjusted)
 * - Handle state
 * - Error boundary
 * - Loading state
 * 
 * Shell does NOT contain asset-specific code.
 * All differences come from AssetConfig.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getAssetConfig } from '../config/assetConfig';
import { theme } from '../core/theme';
import { FRACTAL_MODES, ACTION_TYPES, META_TYPES, META_IMPACTS, GUARD_LEVELS } from '../platform.contracts';
import { FractalTabs } from './FractalTabs';
import { PredictionPanel } from './PredictionPanel';
import { AdjustedPanel, GuardBanner } from './AdjustedPanel';
import { EvidencePanel } from './EvidencePanel';
import { ChartAdapter } from './ChartAdapter';
import { useFocusPack } from '../hooks/useFocusPack';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

/**
 * Transform focusPack to unified prediction format
 */
function buildPrediction(focusPack, assetId) {
  if (!focusPack) return null;
  
  // Get decision from focusPack (DXY has it directly, BTC/SPX in different places)
  const decision = focusPack.decision || {};
  const scenario = focusPack.scenario || {};
  const overlay = focusPack.overlay || {};
  
  // Determine action
  let action = ACTION_TYPES.HOLD;
  if (decision.action) {
    action = decision.action === 'LONG' ? ACTION_TYPES.LONG : 
             decision.action === 'SHORT' ? ACTION_TYPES.SHORT : 
             ACTION_TYPES.HOLD;
  } else if (scenario.base?.return > 0.02) {
    action = ACTION_TYPES.LONG;
  } else if (scenario.base?.return < -0.02) {
    action = ACTION_TYPES.SHORT;
  }
  
  // Confidence
  const confidenceValue = (decision.confidence || overlay.stats?.hitRate * 100 || 50) / 100;
  
  return {
    action,
    confidence: {
      value: confidenceValue,
      formatted: `${(confidenceValue * 100).toFixed(0)}%`,
      meta: {
        type: META_TYPES.CONFIDENCE,
        impact: confidenceValue >= 0.7 ? META_IMPACTS.RISK_ON : META_IMPACTS.NEUTRAL,
      },
    },
    regimeBias: {
      value: focusPack.phase?.currentPhase || 'NEUTRAL',
      formatted: focusPack.phase?.currentPhase || 'Neutral',
      meta: {
        type: META_TYPES.REGIME,
        impact: META_IMPACTS.NEUTRAL,
      },
    },
    tradingEnabled: confidenceValue >= 0.5,
  };
}

/**
 * FractalShell Component
 */
export function FractalShell({ 
  assetId = 'btc',
  focus = '30d',
  onFocusChange,
  className = '',
  showChart = true,
  showPrediction = true,
  showAdjusted = true,
  showEvidence = false,
}) {
  const config = getAssetConfig(assetId);
  const symbol = assetId.toUpperCase();
  
  // Mode state
  const [mode, setMode] = useState(FRACTAL_MODES.SYNTHETIC);
  const [viewMode, setViewMode] = useState('ABS');
  
  // Use the unified useFocusPack hook
  const {
    data: focusPack,
    loading,
    error,
    meta,
    overlay,
    forecast,
    diagnostics,
    scenario,
    phaseId,
    setPhaseId,
    asOf,
    setAsOf,
  } = useFocusPack(symbol, focus);
  
  // Adjusted data state (fetched separately for cascade/macro)
  const [adjustedData, setAdjustedData] = useState(null);
  const [adjustedLoading, setAdjustedLoading] = useState(false);
  
  // Fetch adjusted/cascade data
  useEffect(() => {
    const fetchAdjusted = async () => {
      if (!config.adjustedEndpoint) return;
      
      setAdjustedLoading(true);
      try {
        const url = `${API_BASE}${config.adjustedEndpoint}?focus=${focus}`;
        const res = await fetch(url);
        
        if (res.ok) {
          const data = await res.json();
          
          // Transform based on response structure
          if (data.ok || data.cascade || data.macro) {
            const cascade = data.cascade || data.macro || data;
            setAdjustedData({
              baseSize: cascade.baseSize || 1.0,
              finalSize: {
                value: cascade.finalSize || cascade.size || cascade.sizeAdj || 1.0,
                formatted: `${((cascade.finalSize || cascade.size || 1.0) * 100).toFixed(0)}%`,
                meta: {
                  type: META_TYPES.ALLOCATION,
                  impact: (cascade.finalSize || 1.0) < 0.5 ? META_IMPACTS.RISK_OFF : META_IMPACTS.NEUTRAL,
                },
              },
              guardLevel: {
                value: cascade.guard || cascade.guardLevel || GUARD_LEVELS.NONE,
                formatted: cascade.guard || 'None',
                meta: {
                  type: META_TYPES.STRESS,
                  impact: cascade.guard && cascade.guard !== GUARD_LEVELS.NONE ? META_IMPACTS.RISK_OFF : META_IMPACTS.NEUTRAL,
                },
              },
              multipliers: cascade.multipliers ? Object.entries(cascade.multipliers).map(([label, value]) => ({
                label,
                value: typeof value === 'number' ? value : value?.value || 1,
                meta: {
                  type: META_TYPES.MULTIPLIER,
                  direction: (typeof value === 'number' ? value : 1) < 1 ? 'negative' : 'positive',
                },
              })) : [],
            });
          }
        }
      } catch (err) {
        console.warn(`[FractalShell] Adjusted fetch warning:`, err);
      } finally {
        setAdjustedLoading(false);
      }
    };
    
    fetchAdjusted();
  }, [config.adjustedEndpoint, focus]);
  
  // Build prediction from focusPack
  const prediction = buildPrediction(focusPack, assetId);
  
  // Determine available modes
  const availableModes = [
    FRACTAL_MODES.SYNTHETIC,
    FRACTAL_MODES.REPLAY,
    FRACTAL_MODES.HYBRID,
  ];
  if (adjustedData) {
    availableModes.push(FRACTAL_MODES.ADJUSTED);
  }
  
  // Loading state
  if (loading && !focusPack) {
    return (
      <div 
        className={`min-h-[400px] flex items-center justify-center ${className}`}
        style={{ background: theme.section }}
        data-testid="fractal-shell-loading"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
          <span style={{ color: theme.textSecondary }}>Loading {config.displayName}...</span>
        </div>
      </div>
    );
  }
  
  // Error state (only if no cached data)
  if (error && !focusPack) {
    return (
      <div 
        className={`min-h-[400px] flex items-center justify-center ${className}`}
        style={{ background: theme.negativeLight }}
        data-testid="fractal-shell-error"
      >
        <div className="text-center">
          <div className="text-2xl mb-2">⚠️</div>
          <div style={{ color: theme.negative }}>Failed to load {config.displayName}</div>
          <div className="text-sm mt-1" style={{ color: theme.textMuted }}>{error}</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={className} data-testid={`fractal-shell-${assetId}`}>
      {/* Header */}
      <div 
        className="p-4 flex items-center justify-between"
        style={{ 
          background: theme.card,
          borderBottom: `1px solid ${theme.border}`,
        }}
        data-testid={`fractal-shell-header-${assetId}`}
      >
        <div>
          <h2 className="text-lg font-bold" style={{ color: theme.textPrimary }} data-testid="fractal-shell-title">
            {config.displayName}
          </h2>
          <span className="text-sm" style={{ color: theme.textSecondary }} data-testid="fractal-shell-subtitle">
            Fractal Analysis • {focus}
            {loading && <span className="ml-2 text-xs">(updating...)</span>}
          </span>
        </div>
        
        {/* Mode tabs */}
        <FractalTabs
          mode={mode}
          onModeChange={setMode}
          availableModes={availableModes}
        />
      </div>
      
      {/* Guard Banner (if active) */}
      {adjustedData?.guardLevel?.value && adjustedData.guardLevel.value !== GUARD_LEVELS.NONE && (
        <GuardBanner guardLevel={adjustedData.guardLevel.value} className="mx-4 mt-4" />
      )}
      
      {/* Chart */}
      {showChart && (
        <div style={{ background: theme.card }} data-testid={`fractal-chart-container-${assetId}`}>
          <ChartAdapter
            focusPack={focusPack}
            mode={mode}
            assetId={assetId}
            focus={focus}
            width={1100}
            height={460}
            viewMode={viewMode}
            onPhaseFilter={setPhaseId}
          />
        </div>
      )}
      
      {/* Prediction Panel */}
      {showPrediction && prediction && (
        <div className="p-4">
          <PredictionPanel prediction={prediction} />
        </div>
      )}
      
      {/* Adjusted Panel (only in adjusted mode) */}
      {showAdjusted && mode === FRACTAL_MODES.ADJUSTED && adjustedData && (
        <div className="px-4 pb-4">
          <AdjustedPanel adjusted={adjustedData} />
        </div>
      )}
      
      {/* Evidence Panel (optional) */}
      {showEvidence && focusPack?.evidence && (
        <div className="px-4 pb-4">
          <EvidencePanel evidence={focusPack.evidence} />
        </div>
      )}
      
      {/* Scenario Summary (from focusPack) */}
      {scenario && (
        <div className="px-4 pb-4">
          <ScenarioSummary scenario={scenario} config={config} />
        </div>
      )}
    </div>
  );
}

/**
 * Scenario Summary — Shows bear/base/bull outcomes
 */
function ScenarioSummary({ scenario, config }) {
  if (!scenario) return null;
  
  const formatReturn = (val) => {
    if (typeof val !== 'number') return '—';
    return `${val >= 0 ? '+' : ''}${(val * 100).toFixed(1)}%`;
  };
  
  return (
    <div 
      className="rounded-xl p-4"
      style={{ 
        background: theme.card,
        border: `1px solid ${theme.border}`,
      }}
      data-testid="scenario-summary"
    >
      <h3 
        className="text-sm font-semibold uppercase tracking-wide mb-3"
        style={{ color: theme.textSecondary }}
      >
        Expected Outcomes
      </h3>
      
      <div className="grid grid-cols-3 gap-4">
        {/* Bear */}
        <div className="text-center">
          <div className="text-xs" style={{ color: theme.textMuted }}>Bear Case</div>
          <div className="text-lg font-bold" style={{ color: theme.negative }}>
            {formatReturn(scenario.bear?.return)}
          </div>
        </div>
        
        {/* Base */}
        <div className="text-center">
          <div className="text-xs" style={{ color: theme.textMuted }}>Base Case</div>
          <div 
            className="text-lg font-bold" 
            style={{ color: (scenario.base?.return || 0) >= 0 ? theme.positive : theme.negative }}
          >
            {formatReturn(scenario.base?.return)}
          </div>
        </div>
        
        {/* Bull */}
        <div className="text-center">
          <div className="text-xs" style={{ color: theme.textMuted }}>Bull Case</div>
          <div className="text-lg font-bold" style={{ color: theme.positive }}>
            {formatReturn(scenario.bull?.return)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FractalShell;
