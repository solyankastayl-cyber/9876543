/**
 * PHASE 2 — P0.2: Horizon Matrix
 * 
 * Table showing all horizons with:
 * - Direction (BULL/BEAR/NEUTRAL)
 * - Confidence bar
 * - Reliability badge
 * - Weight
 * - Blockers
 * - Click to focus
 */

import React from 'react';

const TIER_COLORS = {
  TIMING: '#3b82f6',
  TACTICAL: '#8b5cf6',
  STRUCTURE: '#ef4444',
};

const DIR_STYLES = {
  BULL: { bg: '#dcfce7', color: '#166534', icon: '↑' },
  BEAR: { bg: '#fee2e2', color: '#991b1b', icon: '↓' },
  NEUTRAL: { bg: '#f3f4f6', color: '#374151', icon: '—' },
};

export function HorizonMatrix({ horizonMatrix, focus, onFocusChange }) {
  if (!horizonMatrix || horizonMatrix.length === 0) {
    return <div style={{ padding: '20px', color: '#888' }}>No horizon data</div>;
  }

  return (
    <div style={{
      borderRadius: '12px',
      overflow: 'hidden',
      background: '#fff'
    }}>
      {/* Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '80px 100px 120px 80px 80px 80px 1fr',
        padding: '12px 16px',
        background: '#f8fafc',
        borderBottom: '1px solid #e5e5e5',
        fontSize: '11px',
        fontWeight: 600,
        color: '#64748b',
        textTransform: 'uppercase'
      }}>
        <div>Horizon</div>
        <div>Direction</div>
        <div>Confidence</div>
        <div>Reliability</div>
        <div>Entropy</div>
        <div>Tail Risk</div>
        <div>Blockers</div>
      </div>

      {/* Rows */}
      {horizonMatrix.map(h => {
        const dirStyle = DIR_STYLES[h.direction] || DIR_STYLES.NEUTRAL;
        const isActive = focus === h.horizon;
        const tierColor = TIER_COLORS[h.tier] || '#888';

        return (
          <div
            key={h.horizon}
            onClick={() => onFocusChange(h.horizon)}
            style={{
              display: 'grid',
              gridTemplateColumns: '80px 100px 120px 80px 80px 80px 1fr',
              padding: '14px 16px',
              borderBottom: '1px solid #f1f5f9',
              cursor: 'pointer',
              background: isActive ? '#f0f9ff' : '#fff',
              transition: 'background 0.2s'
            }}
          >
            {/* Horizon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: tierColor
              }} />
              <span style={{
                fontSize: '14px',
                fontWeight: isActive ? 700 : 600,
                color: isActive ? tierColor : '#1e293b'
              }}>
                {h.horizon.toUpperCase()}
              </span>
            </div>

            {/* Direction */}
            <div>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: dirStyle.bg,
                color: dirStyle.color,
                fontSize: '12px',
                fontWeight: 600
              }}>
                {dirStyle.icon} {h.direction}
              </span>
            </div>

            {/* Confidence Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                flex: 1,
                height: '6px',
                background: '#e5e5e5',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min(100, h.confidence * 100)}%`,
                  height: '100%',
                  background: h.confidence > 0.3 ? '#22c55e' :
                             h.confidence > 0.1 ? '#eab308' : '#9ca3af',
                  borderRadius: '3px'
                }} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, minWidth: '32px' }}>
                {(h.confidence * 100).toFixed(0)}%
              </span>
            </div>

            {/* Reliability */}
            <div>
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                color: h.reliability > 0.8 ? '#16a34a' :
                       h.reliability > 0.6 ? '#ca8a04' : '#dc2626'
              }}>
                {(h.reliability * 100).toFixed(0)}%
              </span>
            </div>

            {/* Entropy */}
            <div>
              <span style={{
                fontSize: '12px',
                color: h.entropy > 0.7 ? '#dc2626' :
                       h.entropy > 0.5 ? '#ca8a04' : '#16a34a'
              }}>
                {(h.entropy * 100).toFixed(0)}%
              </span>
            </div>

            {/* Tail Risk */}
            <div>
              <span style={{
                fontSize: '12px',
                color: h.tailRisk > 0.5 ? '#dc2626' :
                       h.tailRisk > 0.35 ? '#ca8a04' : '#16a34a'
              }}>
                {(h.tailRisk * 100).toFixed(0)}%
              </span>
            </div>

            {/* Blockers */}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {h.blockers?.slice(0, 3).map((b, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '9px',
                    padding: '2px 6px',
                    background: '#fef2f2',
                    color: '#991b1b',
                    borderRadius: '4px',
                    fontWeight: 500
                  }}
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default HorizonMatrix;
