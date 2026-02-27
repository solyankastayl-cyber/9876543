/**
 * ENGINE GLOBAL SHELL — Portfolio allocations & policy view
 * 
 * Shows:
 * - Global Regime Banner
 * - Allocation Bars (SPX/BTC/CASH)
 * - Policy Breakdown
 * - Scenario Probabilities
 * - Evidence Viewer
 */

import React, { useState, useEffect } from 'react';
import { theme } from '../core/theme';
import { StatBlock } from '../fractal-ui/StatBlock';
import { META_TYPES, META_IMPACTS, GUARD_LEVELS, getGuardColor, SCENARIO_TYPES } from '../platform.contracts';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

/**
 * EngineGlobalShell Component
 */
export function EngineGlobalShell({ className = '' }) {
  const [engineData, setEngineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch engine global data
  useEffect(() => {
    const fetchEngineData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/engine/global`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const data = await res.json();
        setEngineData(data);
        setError(null);
      } catch (err) {
        console.error('[EngineGlobalShell] Fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEngineData();
  }, []);
  
  if (loading) {
    return (
      <div 
        className={`min-h-[400px] flex items-center justify-center ${className}`}
        style={{ background: theme.section }}
        data-testid="engine-shell-loading"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
          <span style={{ color: theme.textSecondary }}>Loading Engine Global...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div 
        className={`min-h-[400px] flex items-center justify-center ${className}`}
        style={{ background: theme.negativeLight }}
        data-testid="engine-shell-error"
      >
        <div className="text-center">
          <div className="text-2xl mb-2">⚠️</div>
          <div style={{ color: theme.negative }}>Failed to load Engine</div>
          <div className="text-sm mt-1" style={{ color: theme.textMuted }}>{error}</div>
        </div>
      </div>
    );
  }
  
  const { global, meta } = engineData || {};
  const allocations = global?.allocations || {};
  const policy = global?.policy || {};
  const scenarios = global?.scenarios || {};
  const guard = global?.guard || {};
  
  return (
    <div className={className} data-testid="engine-global-shell">
      {/* Regime Banner */}
      <RegimeBanner 
        regime={global?.regime}
        guard={guard}
      />
      
      {/* Allocation Bars */}
      <div className="p-4">
        <AllocationBars allocations={allocations} />
      </div>
      
      {/* Policy Breakdown */}
      <div className="p-4">
        <PolicyBreakdown policy={policy} />
      </div>
      
      {/* Scenario Probabilities */}
      {scenarios && (
        <div className="p-4">
          <ScenarioProbabilities scenarios={scenarios} />
        </div>
      )}
      
      {/* Meta Info */}
      <div className="p-4 border-t" style={{ borderColor: theme.border }}>
        <div className="flex items-center gap-4 text-xs" style={{ color: theme.textMuted }}>
          <span>Version: {meta?.version}</span>
          <span>As Of: {meta?.asOf}</span>
          <span>Latency: {meta?.latencyMs}ms</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Regime Banner
 */
function RegimeBanner({ regime, guard }) {
  const regimeText = regime?.current || 'NEUTRAL';
  const guardLevel = guard?.level || GUARD_LEVELS.NONE;
  const guardColor = getGuardColor(guardLevel);
  
  // Regime colors
  const regimeColors = {
    RISK_ON: theme.positive,
    RISK_OFF: theme.negative,
    NEUTRAL: theme.textSecondary,
    DEFENSIVE: theme.warning,
  };
  const regimeColor = regimeColors[regimeText] || theme.textSecondary;
  
  return (
    <div 
      className="p-6"
      style={{ 
        background: theme.card,
        borderBottom: `1px solid ${theme.border}`,
      }}
      data-testid="regime-banner"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase" style={{ color: theme.textMuted }}>Global Regime</div>
          <div className="text-2xl font-bold" style={{ color: regimeColor }}>
            {regimeText}
          </div>
          {regime?.confidence && (
            <div className="text-sm" style={{ color: theme.textSecondary }}>
              Confidence: {(regime.confidence * 100).toFixed(0)}%
            </div>
          )}
        </div>
        
        {/* Guard Badge */}
        <div 
          className="px-4 py-2 rounded-lg"
          style={{ 
            background: `${guardColor}15`,
            border: `1px solid ${guardColor}`,
          }}
        >
          <div className="text-xs uppercase" style={{ color: theme.textMuted }}>Guard</div>
          <div className="font-bold" style={{ color: guardColor }}>
            {guardLevel}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Allocation Bars
 */
function AllocationBars({ allocations }) {
  const assets = [
    { id: 'spx', name: 'S&P 500', color: '#2563EB' },
    { id: 'btc', name: 'Bitcoin', color: '#F7931A' },
    { id: 'cash', name: 'Cash', color: '#6B7280' },
  ];
  
  return (
    <div 
      className="rounded-xl p-6"
      style={{ 
        background: theme.card,
        border: `1px solid ${theme.border}`,
      }}
      data-testid="allocation-bars"
    >
      <h3 
        className="text-sm font-semibold uppercase tracking-wide mb-4"
        style={{ color: theme.textSecondary }}
      >
        Portfolio Allocations
      </h3>
      
      <div className="space-y-4">
        {assets.map(asset => {
          // BOUNDS CHECK: size never > 1, never < 0
          const rawValue = allocations[asset.id] || 0;
          const value = Math.max(0, Math.min(1, rawValue));
          const percentage = value * 100;
          
          return (
            <div key={asset.id} className="flex items-center gap-4">
              <div className="w-24 text-sm" style={{ color: theme.textSecondary }}>
                {asset.name}
              </div>
              
              <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ background: theme.section }}>
                <div 
                  className="h-full rounded-full transition-all"
                  style={{ 
                    width: `${percentage}%`,
                    background: asset.color,
                  }}
                />
              </div>
              
              <div className="w-16 text-right font-mono font-medium" style={{ color: theme.textPrimary }}>
                {percentage.toFixed(0)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Policy Breakdown
 */
function PolicyBreakdown({ policy }) {
  if (!policy || Object.keys(policy).length === 0) return null;
  
  const items = Object.entries(policy).map(([key, value]) => ({
    label: key.replace(/([A-Z])/g, ' $1').trim(),
    value: typeof value === 'number' ? value : value?.value || 0,
  }));
  
  return (
    <div 
      className="rounded-xl p-6"
      style={{ 
        background: theme.card,
        border: `1px solid ${theme.border}`,
      }}
      data-testid="policy-breakdown"
    >
      <h3 
        className="text-sm font-semibold uppercase tracking-wide mb-4"
        style={{ color: theme.textSecondary }}
      >
        Policy Breakdown
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map(item => (
          <div 
            key={item.label}
            className="p-3 rounded-lg"
            style={{ background: theme.section }}
          >
            <div className="text-xs" style={{ color: theme.textMuted }}>{item.label}</div>
            <div 
              className="text-lg font-bold"
              style={{ 
                color: item.value < 1 ? theme.warning : theme.textPrimary,
              }}
            >
              ×{item.value.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Scenario Probabilities
 */
function ScenarioProbabilities({ scenarios }) {
  const scenarioList = [
    { id: SCENARIO_TYPES.BEAR, name: 'Bear', color: theme.negative },
    { id: SCENARIO_TYPES.BASE, name: 'Base', color: theme.accent },
    { id: SCENARIO_TYPES.BULL, name: 'Bull', color: theme.positive },
  ];
  
  // Normalize if probabilities exist
  const probs = scenarios.probabilities || {};
  
  return (
    <div 
      className="rounded-xl p-6"
      style={{ 
        background: theme.card,
        border: `1px solid ${theme.border}`,
      }}
      data-testid="scenario-probabilities"
    >
      <h3 
        className="text-sm font-semibold uppercase tracking-wide mb-4"
        style={{ color: theme.textSecondary }}
      >
        Scenario Probabilities
      </h3>
      
      <div className="grid grid-cols-3 gap-4">
        {scenarioList.map(scenario => {
          const prob = probs[scenario.id.toLowerCase()] || 0.33;
          
          return (
            <div key={scenario.id} className="text-center">
              <div className="text-xs uppercase" style={{ color: theme.textMuted }}>
                {scenario.name}
              </div>
              <div 
                className="text-2xl font-bold"
                style={{ color: scenario.color }}
              >
                {(prob * 100).toFixed(0)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default EngineGlobalShell;
