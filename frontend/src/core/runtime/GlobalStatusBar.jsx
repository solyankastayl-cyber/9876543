/**
 * GLOBAL STATUS BAR — Mini header strip for instant visibility
 * 
 * Shows:
 * - Guard Level (NONE/WARN/CRISIS/BLOCK)
 * - Regime (RISK_ON/RISK_OFF/NEUTRAL)
 * - Liquidity (EXPANSION/CONTRACTION/NEUTRAL)
 * 
 * Must-have for trader instant visibility.
 */

import React, { memo } from 'react';
import { theme } from '../theme';
import { useEngineMonitor } from './useEngineMonitor';
import { GUARD_LEVELS, getGuardColor } from '../../platform.contracts';

/**
 * Guard colors mapping
 */
const GUARD_CONFIG = {
  [GUARD_LEVELS.NONE]: { label: 'CLEAR', color: theme.positive, bg: theme.positiveLight },
  [GUARD_LEVELS.WARN]: { label: 'WARN', color: theme.warning, bg: theme.warningLight },
  [GUARD_LEVELS.CRISIS]: { label: 'CRISIS', color: '#F97316', bg: '#FFF7ED' },
  [GUARD_LEVELS.BLOCK]: { label: 'BLOCK', color: theme.negative, bg: theme.negativeLight },
};

/**
 * Regime colors mapping
 */
const REGIME_CONFIG = {
  RISK_ON: { label: 'RISK ON', color: theme.positive, icon: '↑' },
  RISK_OFF: { label: 'RISK OFF', color: theme.negative, icon: '↓' },
  NEUTRAL: { label: 'NEUTRAL', color: theme.textSecondary, icon: '—' },
  DEFENSIVE: { label: 'DEFENSIVE', color: theme.warning, icon: '⚡' },
};

/**
 * GlobalStatusBar Component
 */
export const GlobalStatusBar = memo(function GlobalStatusBar({ 
  className = '',
  showLiquidity = true,
  compact = false,
}) {
  const { guardLevel, regime, state, lastUpdate, error } = useEngineMonitor({
    interval: 60000,
    enabled: true,
  });
  
  const guardConfig = GUARD_CONFIG[guardLevel] || GUARD_CONFIG[GUARD_LEVELS.NONE];
  const regimeConfig = REGIME_CONFIG[regime] || REGIME_CONFIG.NEUTRAL;
  
  // Liquidity state (derived from allocations or backend)
  const liquidityState = state?.allocations?.cash > 0.3 ? 'CONTRACTION' : 
                         state?.allocations?.cash < 0.1 ? 'EXPANSION' : 'NEUTRAL';
  
  const liquidityConfig = {
    EXPANSION: { label: 'EXPANSION', color: theme.positive },
    CONTRACTION: { label: 'CONTRACTION', color: theme.negative },
    NEUTRAL: { label: 'NEUTRAL', color: theme.textSecondary },
  };
  
  if (compact) {
    return (
      <div 
        className={`flex items-center gap-3 px-3 py-1.5 ${className}`}
        style={{ 
          background: theme.section,
          borderBottom: `1px solid ${theme.border}`,
        }}
        data-testid="global-status-bar-compact"
      >
        {/* Guard */}
        <StatusPill 
          label="G" 
          value={guardConfig.label} 
          color={guardConfig.color}
        />
        
        {/* Regime */}
        <StatusPill 
          label="R" 
          value={regimeConfig.icon} 
          color={regimeConfig.color}
        />
        
        {/* Error indicator */}
        {error && <span className="text-xs" style={{ color: theme.negative }}>⚠</span>}
      </div>
    );
  }
  
  return (
    <div 
      className={`flex items-center justify-between px-4 py-2 ${className}`}
      style={{ 
        background: theme.section,
        borderBottom: `1px solid ${theme.border}`,
      }}
      data-testid="global-status-bar"
    >
      <div className="flex items-center gap-6">
        {/* Guard Level */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase" style={{ color: theme.textMuted }}>
            Guard
          </span>
          <span 
            className="px-2 py-0.5 rounded text-xs font-bold"
            style={{ 
              background: guardConfig.bg,
              color: guardConfig.color,
            }}
          >
            {guardConfig.label}
          </span>
        </div>
        
        {/* Regime */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase" style={{ color: theme.textMuted }}>
            Regime
          </span>
          <span 
            className="text-sm font-semibold flex items-center gap-1"
            style={{ color: regimeConfig.color }}
          >
            <span>{regimeConfig.icon}</span>
            <span>{regimeConfig.label}</span>
          </span>
        </div>
        
        {/* Liquidity */}
        {showLiquidity && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase" style={{ color: theme.textMuted }}>
              Liquidity
            </span>
            <span 
              className="text-xs font-medium"
              style={{ color: liquidityConfig[liquidityState]?.color }}
            >
              {liquidityConfig[liquidityState]?.label}
            </span>
          </div>
        )}
      </div>
      
      {/* Last update */}
      <div className="text-xs" style={{ color: theme.textMuted }}>
        {lastUpdate ? `Updated ${formatTimeAgo(lastUpdate)}` : 'Loading...'}
        {error && <span className="ml-2" style={{ color: theme.negative }}>⚠ Error</span>}
      </div>
    </div>
  );
});

/**
 * Compact status pill
 */
function StatusPill({ label, value, color }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] font-medium" style={{ color: theme.textMuted }}>
        {label}:
      </span>
      <span className="text-xs font-bold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

/**
 * Format time ago
 */
function formatTimeAgo(date) {
  if (!date) return '';
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 120) return '1m ago';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export default GlobalStatusBar;
