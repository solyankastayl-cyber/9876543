/**
 * BLOCK 70.2 STEP 2 — HorizonSelector 2.0
 * UX REFACTOR — Human-readable horizon selection
 * 
 * Real horizon control with:
 * - Tier color coding (TIMING/TACTICAL/STRUCTURE)
 * - Match count preview
 * - Active state indication
 * - Clear explanation of what horizon means
 */

import React from 'react';
import { HORIZONS, getTierColor, getTierLabel } from '../../hooks/useFocusPack';

export const HorizonSelector = ({ 
  focus, 
  onFocusChange, 
  matchesCounts = {},
  loading = false,
  className = ''
}) => {
  return (
    <div className={`flex flex-col gap-3 ${className}`} data-testid="horizon-selector">
      {/* Explanation header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">Projection Horizon</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Select how many days ahead the projection is calculated
          </p>
        </div>
      </div>
      
      {/* Pills row */}
      <div className="flex gap-1.5 p-1.5 bg-slate-100 rounded-xl">
        {HORIZONS.map(h => {
          const isActive = focus === h.key;
          const count = matchesCounts[h.key];
          const tierColor = getTierColor(h.tier);
          
          return (
            <button
              key={h.key}
              onClick={() => onFocusChange(h.key)}
              disabled={loading}
              className={`
                relative px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1
                ${isActive 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'}
                ${loading ? 'opacity-50 cursor-wait' : ''}
              `}
              data-testid={`horizon-${h.key}`}
            >
              {/* Tier indicator bar */}
              <div 
                className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full transition-opacity"
                style={{ 
                  backgroundColor: tierColor,
                  opacity: isActive ? 1 : 0.3
                }}
              />
              
              {/* Label */}
              <span className="block font-semibold">{h.label}</span>
              
              {/* Match count (if available) */}
              {count !== undefined && (
                <span className="block text-[10px] text-slate-400 mt-0.5">
                  {count} matches
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Tier legend with explanations */}
      <div className="flex items-center justify-between px-2 text-xs">
        <span className="text-slate-500 font-medium">
          {getTierLabel(HORIZONS.find(h => h.key === focus)?.tier)}
        </span>
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5" title="Short-term entry timing (7-14 days)">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getTierColor('TIMING') }}/>
            <span className="text-slate-500">Timing</span>
          </span>
          <span className="flex items-center gap-1.5" title="Medium-term position management (30-90 days)">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getTierColor('TACTICAL') }}/>
            <span className="text-slate-500">Tactical</span>
          </span>
          <span className="flex items-center gap-1.5" title="Long-term structural bias (180-365 days)">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getTierColor('STRUCTURE') }}/>
            <span className="text-slate-500">Structure</span>
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Compact version for inline use
 */
export const HorizonPills = ({ focus, onFocusChange, loading = false }) => {
  return (
    <div className="flex gap-1.5" data-testid="horizon-pills">
      {HORIZONS.map(h => {
        const isActive = focus === h.key;
        return (
          <button
            key={h.key}
            onClick={() => onFocusChange(h.key)}
            disabled={loading}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${isActive 
                ? 'bg-slate-800 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
              ${loading ? 'opacity-50' : ''}
            `}
            data-testid={`pill-${h.key}`}
          >
            {h.label}
          </button>
        );
      })}
    </div>
  );
};

export default HorizonSelector;
