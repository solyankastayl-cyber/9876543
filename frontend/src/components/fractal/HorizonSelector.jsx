/**
 * PHASE 2 — P0.2: Horizon Selector
 * 
 * Two-level selector:
 * 1. Set toggle: SHORT (7/14/30) vs EXTENDED (7/14/30/90/180/365)
 * 2. Focus selector: individual horizon pills
 */

import React from 'react';

const SHORT_HORIZONS = ['7d', '14d', '30d'];
const EXTENDED_HORIZONS = ['7d', '14d', '30d', '90d', '180d', '365d'];

const TIER_COLORS = {
  TIMING: '#3b82f6',    // blue
  TACTICAL: '#8b5cf6',  // purple
  STRUCTURE: '#ef4444', // red
};

function getTier(horizon) {
  if (['180d', '365d'].includes(horizon)) return 'STRUCTURE';
  if (['30d', '90d'].includes(horizon)) return 'TACTICAL';
  return 'TIMING';
}

export function HorizonSelector({ set, focus, onSetChange, onFocusChange }) {
  const horizons = set === 'extended' ? EXTENDED_HORIZONS : SHORT_HORIZONS;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: '16px',
      background: '#fafafa',
      borderRadius: '12px'
    }}>
      {/* Set Toggle */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>Horizon Set:</span>
        <div style={{
          display: 'flex',
          background: '#e5e5e5',
          borderRadius: '8px',
          padding: '2px'
        }}>
          {['short', 'extended'].map(s => (
            <button
              key={s}
              onClick={() => onSetChange(s)}
              style={{
                padding: '6px 16px',
                fontSize: '12px',
                fontWeight: 600,
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                background: set === s ? '#fff' : 'transparent',
                color: set === s ? '#000' : '#666',
                boxShadow: set === s ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Focus Selector */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {horizons.map(h => {
          const tier = getTier(h);
          const isActive = focus === h;
          return (
            <button
              key={h}
              onClick={() => onFocusChange(h)}
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '8px',
                cursor: 'pointer',
                background: isActive ? `${TIER_COLORS[tier]}15` : '#fff',
                color: isActive ? TIER_COLORS[tier] : '#666',
                transition: 'all 0.2s',
                position: 'relative'
              }}
            >
              {h.toUpperCase()}
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                fontSize: '9px',
                padding: '2px 4px',
                borderRadius: '4px',
                background: TIER_COLORS[tier],
                color: '#fff',
                fontWeight: 700,
                opacity: isActive ? 1 : 0
              }}>
                {tier.charAt(0)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', fontSize: '10px', color: '#888' }}>
        <span><span style={{ color: TIER_COLORS.TIMING }}>●</span> Timing (Entry)</span>
        <span><span style={{ color: TIER_COLORS.TACTICAL }}>●</span> Tactical (Position)</span>
        <span><span style={{ color: TIER_COLORS.STRUCTURE }}>●</span> Structure (Bias)</span>
      </div>
    </div>
  );
}

export default HorizonSelector;
