/**
 * MACRO DASHBOARD — Shows macro indicators for DXY
 * 
 * Displays:
 * - Macro Score
 * - Guard Level
 * - Component breakdown (rates, credit, housing, inflation, etc.)
 * - Key drivers
 * 
 * This component receives data and displays it.
 * It does NOT contain any calculation logic.
 */

import React, { useState, useEffect } from 'react';
import { theme } from '../core/theme';
import { StatBlock } from '../fractal-ui/StatBlock';
import { META_TYPES, META_IMPACTS, GUARD_LEVELS, getGuardColor } from '../platform.contracts';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

/**
 * MacroDashboard Component
 */
export function MacroDashboard({ className = '' }) {
  const [macroScore, setMacroScore] = useState(null);
  const [guardData, setGuardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch macro data
  useEffect(() => {
    const fetchMacroData = async () => {
      setLoading(true);
      try {
        const [scoreRes, guardRes] = await Promise.all([
          fetch(`${API_BASE}/api/dxy-macro-core/score`),
          fetch(`${API_BASE}/api/dxy-macro-core/guard/current`),
        ]);
        
        if (scoreRes.ok) {
          const scoreData = await scoreRes.json();
          setMacroScore(scoreData);
        }
        
        if (guardRes.ok) {
          const guardData = await guardRes.json();
          setGuardData(guardData);
        }
        
        setError(null);
      } catch (err) {
        console.error('[MacroDashboard] Fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMacroData();
  }, []);
  
  if (loading) {
    return (
      <div 
        className={`p-6 rounded-xl ${className}`}
        style={{ background: theme.section }}
        data-testid="macro-dashboard-loading"
      >
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div 
        className={`p-6 rounded-xl ${className}`}
        style={{ background: theme.negativeLight }}
        data-testid="macro-dashboard-error"
      >
        <div className="text-center" style={{ color: theme.negative }}>
          Failed to load macro data: {error}
        </div>
      </div>
    );
  }
  
  const score = macroScore?.score || {};
  const guard = guardData || {};
  
  // Build stats from macro score
  const scoreStats = [
    {
      label: 'Macro Score',
      value: score.score01 || 0,
      formatted: `${((score.score01 || 0) * 100).toFixed(0)}%`,
      meta: {
        type: META_TYPES.SCORE,
        impact: (score.scoreSigned || 0) < 0 ? META_IMPACTS.RISK_OFF : META_IMPACTS.RISK_ON,
        drivers: score.confidenceReasons,
      },
    },
    {
      label: 'Confidence',
      value: score.confidence || 'LOW',
      formatted: score.confidence || 'Low',
      meta: {
        type: META_TYPES.CONFIDENCE,
        impact: score.confidence === 'HIGH' ? META_IMPACTS.RISK_ON : META_IMPACTS.NEUTRAL,
      },
    },
  ];
  
  // Guard stat
  const guardStat = {
    label: 'Guard Level',
    value: guard.level || GUARD_LEVELS.NONE,
    formatted: guard.level || 'None',
    meta: {
      type: META_TYPES.STRESS,
      impact: guard.level !== GUARD_LEVELS.NONE ? META_IMPACTS.RISK_OFF : META_IMPACTS.NEUTRAL,
    },
  };
  
  return (
    <div 
      className={`rounded-xl p-6 ${className}`}
      style={{ 
        background: theme.card,
        border: `1px solid ${theme.border}`,
      }}
      data-testid="macro-dashboard"
    >
      <h3 
        className="text-sm font-semibold uppercase tracking-wide mb-4"
        style={{ color: theme.textSecondary }}
      >
        Macro Dashboard
      </h3>
      
      {/* Score Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {scoreStats.map((stat, i) => (
          <StatBlock key={stat.label} data={stat} size="lg" />
        ))}
        <StatBlock 
          data={guardStat} 
          size="lg"
          variant={guard.level !== GUARD_LEVELS.NONE ? 'negative' : 'default'}
        />
      </div>
      
      {/* Components Grid */}
      {score.components && score.components.length > 0 && (
        <div>
          <div 
            className="text-xs font-medium uppercase mb-3"
            style={{ color: theme.textMuted }}
          >
            Macro Components
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {score.components.map((comp) => (
              <MacroComponentCard key={comp.seriesId} component={comp} />
            ))}
          </div>
        </div>
      )}
      
      {/* Quality Info */}
      {score.quality && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-4 text-xs" style={{ color: theme.textMuted }}>
            <span>Series: {score.quality.seriesCount}</span>
            <span>Fresh: {score.quality.freshCount}</span>
            <span>Stale: {score.quality.staleCount}</span>
            <span>Quality Penalty: {((score.quality.qualityPenalty || 0) * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Macro Component Card
 */
function MacroComponentCard({ component }) {
  const { displayName, role, rawPressure, normalizedPressure, regime, weight } = component;
  
  // Determine color based on pressure
  const pressureColor = normalizedPressure > 0.02 
    ? theme.negative 
    : normalizedPressure < -0.02 
      ? theme.positive 
      : theme.textSecondary;
  
  // Regime colors
  const regimeColors = {
    EASING: theme.positive,
    TIGHTENING: theme.negative,
    NEUTRAL: theme.textMuted,
    STABLE: theme.textMuted,
  };
  
  return (
    <div 
      className="p-3 rounded-lg"
      style={{ background: theme.section }}
      data-testid={`macro-component-${role}`}
    >
      <div className="text-xs font-medium mb-1" style={{ color: theme.textSecondary }}>
        {displayName || role}
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <div 
            className="text-lg font-bold"
            style={{ color: pressureColor }}
          >
            {(normalizedPressure * 100).toFixed(1)}%
          </div>
          <div className="text-xs" style={{ color: theme.textMuted }}>
            w: {(weight * 100).toFixed(0)}%
          </div>
        </div>
        
        <div 
          className="text-xs px-2 py-0.5 rounded"
          style={{ 
            background: `${regimeColors[regime] || theme.textMuted}20`,
            color: regimeColors[regime] || theme.textMuted,
          }}
        >
          {regime}
        </div>
      </div>
    </div>
  );
}

/**
 * GuardStatusPanel — Detailed guard status
 */
export function GuardStatusPanel({ className = '' }) {
  const [guardData, setGuardData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch(`${API_BASE}/api/dxy-macro-core/guard/current`)
      .then(r => r.json())
      .then(setGuardData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);
  
  if (loading || !guardData) return null;
  
  const { level, stateSince, daysInState, inputs, meta } = guardData;
  const guardColor = getGuardColor(level);
  
  return (
    <div 
      className={`rounded-xl p-4 ${className}`}
      style={{ 
        background: `${guardColor}10`,
        border: `1px solid ${guardColor}`,
      }}
      data-testid="guard-status-panel"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase" style={{ color: theme.textMuted }}>Guard Status</div>
          <div className="text-xl font-bold" style={{ color: guardColor }}>{level}</div>
        </div>
        
        <div className="text-right text-xs" style={{ color: theme.textSecondary }}>
          <div>Since: {stateSince}</div>
          <div>Days: {daysInState}</div>
        </div>
      </div>
      
      {inputs && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: `${guardColor}30` }}>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span style={{ color: theme.textMuted }}>Credit: </span>
              <span>{(inputs.creditComposite * 100).toFixed(0)}%</span>
            </div>
            <div>
              <span style={{ color: theme.textMuted }}>VIX: </span>
              <span>{inputs.vix?.toFixed(1)}</span>
            </div>
            <div>
              <span style={{ color: theme.textMuted }}>Macro: </span>
              <span>{(inputs.macroScoreSigned * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MacroDashboard;
