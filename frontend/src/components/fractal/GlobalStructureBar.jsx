/**
 * PHASE 2 — P0.3: Global Structure Bar
 * 
 * Shows:
 * - Global Bias (BULL/BEAR/NEUTRAL)
 * - Phase
 * - Conflict indicator
 * - Mode + Size
 * - Explain
 */

import React, { useState } from 'react';

const BIAS_COLORS = {
  BULL: { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
  BEAR: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
  NEUTRAL: { bg: '#f3f4f6', border: '#9ca3af', text: '#374151' },
};

const MODE_LABELS = {
  TREND_FOLLOW: 'Trend Follow',
  COUNTER_TREND: 'Counter-Trend',
  HOLD: 'Hold',
};

export function GlobalStructureBar({ structure, resolver }) {
  const [showExplain, setShowExplain] = useState(false);

  if (!structure || !resolver) return null;

  const biasColor = BIAS_COLORS[structure.globalBias] || BIAS_COLORS.NEUTRAL;
  const hasConflict = resolver.conflict?.hasConflict;
  const sizePercent = Math.round((resolver.final?.sizeMultiplier || 0) * 100);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: '16px 20px',
      background: '#fff',
      borderRadius: '14px'
    }}>
      {/* Main Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Global Bias */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>STRUCTURE</span>
          <div style={{
            padding: '8px 16px',
            borderRadius: '8px',
            background: biasColor.bg,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: biasColor.text }}>
              {structure.globalBias}
            </span>
            <span style={{ fontSize: '12px', color: biasColor.text, opacity: 0.8 }}>
              {Math.round(structure.biasStrength * 100)}%
            </span>
          </div>
          <span style={{
            fontSize: '11px',
            padding: '4px 8px',
            background: '#f3f4f6',
            borderRadius: '6px',
            color: '#666'
          }}>
            {structure.dominantHorizon} dominant
          </span>
        </div>

        {/* Phase */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#666' }}>Phase:</span>
          <span style={{
            fontSize: '13px',
            fontWeight: 600,
            padding: '4px 10px',
            background: '#f8fafc',
            borderRadius: '6px',
            color: '#1e293b'
          }}>
            {structure.phase}
          </span>
        </div>

        {/* Conflict */}
        {hasConflict && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: '#fef3c7',
            borderRadius: '8px'
          }}>
            <span style={{ fontSize: '14px' }}>⚠️</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#92400e' }}>
              CONFLICT
            </span>
            <span style={{ fontSize: '11px', color: '#92400e' }}>
              {resolver.conflict.shortTermDir} vs {resolver.conflict.longTermDir}
            </span>
          </div>
        )}

        {/* Final Decision */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 16px',
          background: resolver.final?.action === 'BUY' ? '#dcfce7' :
                     resolver.final?.action === 'SELL' ? '#fee2e2' : '#f3f4f6',
          borderRadius: '10px'
        }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>
              {resolver.final?.action}
            </div>
            <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
              {MODE_LABELS[resolver.final?.mode] || resolver.final?.mode}
            </div>
          </div>
          <div style={{
            padding: '6px 12px',
            background: '#fff',
            borderRadius: '6px'
          }}>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>
              {sizePercent}%
            </div>
            <div style={{ fontSize: '9px', color: '#888' }}>SIZE</div>
          </div>
        </div>
      </div>

      {/* Explain Toggle */}
      <div>
        <button
          onClick={() => setShowExplain(!showExplain)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            color: '#6366f1',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {showExplain ? '▼' : '▶'} Why this decision?
        </button>
        
        {showExplain && (
          <div style={{
            marginTop: '8px',
            padding: '12px',
            background: '#f8fafc',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#475569'
          }}>
            {structure.explain?.map((e, i) => (
              <div key={i} style={{ marginBottom: '4px' }}>• {e}</div>
            ))}
            {resolver.final?.reason && (
              <div style={{ marginTop: '8px', fontWeight: 500 }}>
                → {resolver.final.reason}
              </div>
            )}
            {resolver.final?.blockers?.length > 0 && (
              <div style={{ marginTop: '8px', color: '#dc2626' }}>
                Blockers: {resolver.final.blockers.join(', ')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Consensus Index */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        paddingTop: '8px',
        borderTop: '1px solid #e5e5e5'
      }}>
        <span style={{ fontSize: '11px', color: '#888' }}>Consensus Index:</span>
        <div style={{
          flex: 1,
          height: '6px',
          background: '#e5e5e5',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${(resolver.consensusIndex || 0) * 100}%`,
            height: '100%',
            background: resolver.consensusIndex > 0.7 ? '#22c55e' :
                       resolver.consensusIndex > 0.5 ? '#eab308' : '#ef4444',
            borderRadius: '3px'
          }} />
        </div>
        <span style={{ fontSize: '11px', fontWeight: 600 }}>
          {Math.round((resolver.consensusIndex || 0) * 100)}%
        </span>
      </div>
    </div>
  );
}

export default GlobalStructureBar;
