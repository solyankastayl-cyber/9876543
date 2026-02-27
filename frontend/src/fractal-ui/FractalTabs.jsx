/**
 * FRACTAL TABS — Mode switcher for Fractal views
 * 
 * 4 modes:
 * - Synthetic: Model-generated forecast
 * - Replay: Historical pattern overlay
 * - Hybrid: Combined view
 * - Adjusted: Risk-adjusted (cascade/macro)
 */

import React from 'react';
import { theme } from '../core/theme';
import { FRACTAL_MODES } from '../platform.contracts';

const MODE_CONFIG = {
  [FRACTAL_MODES.SYNTHETIC]: {
    label: 'Price',
    desc: 'Synthetic Model',
    icon: '📈',
  },
  [FRACTAL_MODES.REPLAY]: {
    label: 'Replay',
    desc: 'Historical',
    icon: '🔄',
  },
  [FRACTAL_MODES.HYBRID]: {
    label: 'Hybrid',
    desc: 'Dual View',
    icon: '⚡',
  },
  [FRACTAL_MODES.ADJUSTED]: {
    label: 'Macro',
    desc: 'Hybrid vs Macro',
    icon: '🎯',
  },
};

export function FractalTabs({ 
  mode, 
  onModeChange, 
  availableModes,
  className = '' 
}) {
  // Default to all modes if not specified
  const modes = availableModes || Object.values(FRACTAL_MODES);
  
  return (
    <div 
      className={`inline-flex gap-1 p-1 rounded-lg ${className}`}
      style={{ background: theme.section }}
      data-testid="fractal-tabs"
    >
      {modes.map((m) => {
        const config = MODE_CONFIG[m];
        if (!config) return null;
        
        const isActive = mode === m;
        
        return (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className="px-4 py-2 rounded-md text-sm font-medium transition-all flex flex-col items-center"
            style={{
              background: isActive ? theme.card : 'transparent',
              color: isActive ? theme.textPrimary : theme.textSecondary,
              boxShadow: isActive ? theme.shadowSm : 'none',
            }}
            data-testid={`tab-${m}`}
          >
            <span className="font-semibold">{config.label}</span>
            <span 
              className="text-[10px]"
              style={{ color: theme.textMuted }}
            >
              {config.desc}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Compact tabs (single line, no descriptions)
 */
export function FractalTabsCompact({ mode, onModeChange, availableModes, className = '' }) {
  const modes = availableModes || Object.values(FRACTAL_MODES);
  
  return (
    <div 
      className={`inline-flex gap-1 p-1 rounded-lg ${className}`}
      style={{ background: theme.section }}
    >
      {modes.map((m) => {
        const config = MODE_CONFIG[m];
        if (!config) return null;
        
        const isActive = mode === m;
        
        return (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className="px-3 py-1.5 rounded text-xs font-medium transition-all"
            style={{
              background: isActive ? theme.card : 'transparent',
              color: isActive ? theme.textPrimary : theme.textSecondary,
            }}
          >
            {config.label}
          </button>
        );
      })}
    </div>
  );
}

export default FractalTabs;
