/**
 * ADJUSTED PANEL — Shows cascade/macro adjustments
 * 
 * Displays:
 * - Base size → Final size
 * - Multiplier breakdown
 * - Guard status
 * 
 * UI does NOT know what influences adjustments.
 * It just displays multipliers from backend.
 */

import React from 'react';
import { theme } from '../core/theme';
import { GUARD_LEVELS, getGuardColor, META_TYPES, META_IMPACTS } from '../platform.contracts';
import { StatBlock } from './StatBlock';
import { formatValue } from '../core/explain';

export function AdjustedPanel({ adjusted, className = '' }) {
  if (!adjusted) return null;
  
  const { baseSize, finalSize, guardLevel, multipliers } = adjusted;
  
  // Guard level info
  const guardInfo = {
    [GUARD_LEVELS.NONE]: { label: 'Clear', desc: 'No restrictions' },
    [GUARD_LEVELS.WARN]: { label: 'Warning', desc: 'Reduced sizing' },
    [GUARD_LEVELS.CRISIS]: { label: 'Crisis', desc: 'Heavily reduced' },
    [GUARD_LEVELS.BLOCK]: { label: 'Blocked', desc: 'Trading paused' },
  };
  
  const currentGuard = guardLevel?.value || guardLevel || GUARD_LEVELS.NONE;
  const guard = guardInfo[currentGuard] || guardInfo[GUARD_LEVELS.NONE];
  const guardColor = getGuardColor(currentGuard);
  
  // Final size stat
  const finalSizeStat = {
    label: 'Final Size',
    value: finalSize?.value ?? finalSize,
    formatted: finalSize?.formatted || `${((finalSize?.value ?? finalSize) * 100).toFixed(0)}%`,
    meta: finalSize?.meta || {
      type: META_TYPES.ALLOCATION,
      impact: (finalSize?.value ?? finalSize) < 0.5 ? META_IMPACTS.RISK_OFF : META_IMPACTS.NEUTRAL,
    },
  };
  
  return (
    <div 
      className={`rounded-xl p-6 ${className}`}
      style={{ 
        background: theme.card,
        border: `1px solid ${theme.border}`,
      }}
      data-testid="adjusted-panel"
    >
      <h3 
        className="text-sm font-semibold uppercase tracking-wide mb-4"
        style={{ color: theme.textSecondary }}
      >
        Risk Adjustments
      </h3>
      
      {/* Size transformation */}
      <div className="flex items-center gap-4 mb-6">
        <div className="text-center">
          <div className="text-xs uppercase" style={{ color: theme.textMuted }}>Base</div>
          <div className="text-2xl font-bold" style={{ color: theme.textPrimary }}>
            {((baseSize || 1) * 100).toFixed(0)}%
          </div>
        </div>
        
        <div style={{ color: theme.textMuted }}>→</div>
        
        <div className="text-center">
          <div className="text-xs uppercase" style={{ color: theme.textMuted }}>Adjusted</div>
          <div 
            className="text-2xl font-bold"
            style={{ 
              color: (finalSize?.value ?? finalSize) < 0.5 ? theme.warning : theme.positive,
            }}
          >
            {((finalSize?.value ?? finalSize) * 100).toFixed(0)}%
          </div>
        </div>
        
        {/* Guard badge */}
        <div 
          className="ml-auto px-4 py-2 rounded-lg"
          style={{ 
            background: `${guardColor}15`,
            border: `1px solid ${guardColor}`,
          }}
        >
          <div className="text-xs uppercase" style={{ color: theme.textMuted }}>Guard</div>
          <div className="font-bold" style={{ color: guardColor }}>
            {guard.label}
          </div>
        </div>
      </div>
      
      {/* Multiplier breakdown */}
      {multipliers && multipliers.length > 0 && (
        <div>
          <div 
            className="text-xs font-medium uppercase mb-3"
            style={{ color: theme.textSecondary }}
          >
            Multiplier Breakdown
          </div>
          
          <div className="space-y-2">
            {multipliers.map((mult, i) => {
              const value = mult?.value ?? mult;
              const label = mult?.label || `Factor ${i + 1}`;
              const isReducing = value < 1;
              
              return (
                <div 
                  key={label}
                  className="flex items-center justify-between py-2 px-3 rounded"
                  style={{ background: theme.section }}
                >
                  <span className="text-sm" style={{ color: theme.textSecondary }}>
                    {label}
                  </span>
                  <span 
                    className="font-mono font-medium"
                    style={{ 
                      color: isReducing ? theme.negative : theme.positive,
                    }}
                  >
                    ×{(value).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Guard Banner — Prominent warning when guard is active
 */
export function GuardBanner({ guardLevel, className = '' }) {
  if (!guardLevel || guardLevel === GUARD_LEVELS.NONE) return null;
  
  const guardColor = getGuardColor(guardLevel);
  
  const messages = {
    [GUARD_LEVELS.WARN]: 'Position sizing reduced due to elevated market conditions.',
    [GUARD_LEVELS.CRISIS]: 'Crisis mode active. Position sizing heavily restricted.',
    [GUARD_LEVELS.BLOCK]: 'Trading blocked. All positions should be closed.',
  };
  
  return (
    <div 
      className={`rounded-lg p-4 flex items-center gap-3 ${className}`}
      style={{
        background: `${guardColor}15`,
        border: `1px solid ${guardColor}`,
      }}
      data-testid="guard-banner"
    >
      <span className="text-2xl">⚠️</span>
      <div>
        <div className="font-semibold" style={{ color: guardColor }}>
          {guardLevel} Level Active
        </div>
        <div className="text-sm" style={{ color: theme.textSecondary }}>
          {messages[guardLevel]}
        </div>
      </div>
    </div>
  );
}

export default AdjustedPanel;
