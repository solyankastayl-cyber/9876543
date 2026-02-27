/**
 * BLOCK 73.5.1 — Phase Tooltip Component
 * 
 * Shows phase statistics on hover:
 * - Phase name, duration, dates
 * - Return percentage
 * - Volatility regime
 * - Matches count
 * - Best match info
 */

import React from 'react';

export function PhaseTooltip({ 
  phase, 
  position,
  visible 
}) {
  if (!visible || !phase) return null;
  
  const { x, y } = position;
  
  // Clamp position to viewport
  const tooltipWidth = 220;
  const tooltipHeight = 180;
  const clampedX = Math.min(Math.max(x + 15, 10), window.innerWidth - tooltipWidth - 20);
  const clampedY = Math.min(Math.max(y - 10, 10), window.innerHeight - tooltipHeight - 20);
  
  const returnColor = phase.phaseReturnPct >= 0 ? '#16a34a' : '#dc2626';
  const phaseColor = getPhaseColor(phase.phase);
  
  return (
    <div 
      style={{
        ...styles.container,
        left: clampedX,
        top: clampedY,
        opacity: visible ? 1 : 0,
      }}
      data-testid="phase-tooltip"
    >
      {/* Header */}
      <div style={styles.header}>
        <span style={{ ...styles.phaseBadge, backgroundColor: phaseColor }}>
          {phase.phase}
        </span>
        <span style={styles.duration}>{phase.durationDays} days</span>
      </div>
      
      {/* Return */}
      <div style={styles.returnRow}>
        <span style={{ ...styles.returnValue, color: returnColor }}>
          {phase.phaseReturnPct >= 0 ? '+' : ''}{phase.phaseReturnPct.toFixed(1)}%
        </span>
      </div>
      
      {/* Details */}
      <div style={styles.details}>
        <div style={styles.row}>
          <span style={styles.label}>Vol Regime</span>
          <span style={{ ...styles.value, color: getVolColor(phase.volRegime) }}>
            {phase.volRegime}
          </span>
        </div>
        
        <div style={styles.row}>
          <span style={styles.label}>Matches</span>
          <span style={styles.value}>{phase.matchesCount}</span>
        </div>
        
        {phase.bestMatchId && (
          <div style={styles.row}>
            <span style={styles.label}>Best Match</span>
            <span style={styles.value}>
              {phase.bestMatchId.substring(0, 10)}
              {phase.bestMatchSimilarity && (
                <span style={styles.similarity}>
                  ({(phase.bestMatchSimilarity * 100).toFixed(0)}%)
                </span>
              )}
            </span>
          </div>
        )}
      </div>
      
      {/* Dates */}
      <div style={styles.dates}>
        {formatDate(phase.from)} → {formatDate(phase.to)}
      </div>
    </div>
  );
}

function getPhaseColor(phase) {
  const colors = {
    'ACCUMULATION': '#22c55e',
    'MARKUP': '#16a34a',
    'DISTRIBUTION': '#f59e0b',
    'MARKDOWN': '#ef4444',
    'RECOVERY': '#06b6d4',
    'CAPITULATION': '#dc2626',
    'UNKNOWN': '#6b7280',
  };
  return colors[phase] || '#6b7280';
}

function getVolColor(regime) {
  const colors = {
    'LOW': '#22c55e',
    'NORMAL': '#6b7280',
    'HIGH': '#f59e0b',
    'EXPANSION': '#ef4444',
    'CRISIS': '#dc2626',
  };
  return colors[regime] || '#6b7280';
}

function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

const styles = {
  container: {
    position: 'fixed',
    zIndex: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: 14,
    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
    backdropFilter: 'blur(8px)',
    transition: 'opacity 0.12s ease',
    pointerEvents: 'none',
    minWidth: 200,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  phaseBadge: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: 4,
    letterSpacing: '0.5px',
  },
  duration: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: 500,
  },
  returnRow: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottom: '1px solid #f3f4f6',
  },
  returnValue: {
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: '-0.5px',
  },
  details: {
    marginBottom: 10,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: 500,
  },
  value: {
    fontSize: 12,
    color: '#374151',
    fontWeight: 600,
  },
  similarity: {
    fontSize: 10,
    color: '#9ca3af',
    marginLeft: 4,
  },
  dates: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
    paddingTop: 8,
    borderTop: '1px solid #f3f4f6',
    fontFamily: 'monospace',
  },
};

export default PhaseTooltip;
