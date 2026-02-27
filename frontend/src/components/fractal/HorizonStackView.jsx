/**
 * BLOCK 74.1 — Horizon Stack View Component
 * 
 * Institutional-grade multi-horizon intelligence display.
 * Shows all horizons with adaptive weights, phase grades, divergence.
 * 
 * Click on horizon → changes focus → updates chart/overlay/forecast
 */

import React from 'react';

const TIER_COLORS = {
  TIMING: { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
  TACTICAL: { bg: '#ede9fe', text: '#5b21b6', border: '#8b5cf6' },
  STRUCTURE: { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
};

const DIRECTION_ICONS = {
  BULLISH: { symbol: '↑', color: '#16a34a' },
  BEARISH: { symbol: '↓', color: '#dc2626' },
  FLAT: { symbol: '→', color: '#6b7280' },
};

const GRADE_COLORS = {
  A: { bg: '#dcfce7', text: '#166534' },
  B: { bg: '#d1fae5', text: '#047857' },
  C: { bg: '#fef3c7', text: '#92400e' },
  D: { bg: '#fed7aa', text: '#c2410c' },
  F: { bg: '#fecaca', text: '#991b1b' },
};

export function HorizonStackView({ horizonStack, currentFocus, onFocusChange }) {
  if (!horizonStack || horizonStack.length === 0) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>HORIZON STACK</span>
        <span style={styles.subtitle}>Adaptive Weighting Active</span>
      </div>
      
      <div style={styles.table}>
        {/* Header Row */}
        <div style={styles.headerRow}>
          <span style={styles.colHorizon}>Horizon</span>
          <span style={styles.colDir}>Dir</span>
          <span style={styles.colConf}>Conf</span>
          <span style={styles.colPhase}>Phase</span>
          <span style={styles.colDiv}>Div</span>
          <span style={styles.colMatches}>Matches</span>
          <span style={styles.colWeight}>Weight</span>
        </div>
        
        {/* Data Rows */}
        {horizonStack.map((item) => {
          const tierColor = TIER_COLORS[item.tier] || TIER_COLORS.TACTICAL;
          const dirIcon = DIRECTION_ICONS[item.direction] || DIRECTION_ICONS.FLAT;
          const phaseGradeColor = GRADE_COLORS[item.phase?.grade] || GRADE_COLORS.C;
          const divGradeColor = GRADE_COLORS[item.divergence?.grade] || GRADE_COLORS.C;
          const isActive = item.horizon === currentFocus;
          
          return (
            <div
              key={item.horizon}
              style={{
                ...styles.dataRow,
                backgroundColor: isActive ? '#f0f9ff' : 'transparent',
                borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
              }}
              onClick={() => onFocusChange?.(item.horizon)}
              data-testid={`horizon-row-${item.horizon}`}
            >
              {/* Horizon Badge */}
              <span style={styles.colHorizon}>
                <span style={{
                  ...styles.horizonBadge,
                  backgroundColor: tierColor.bg,
                  color: tierColor.text,
                  borderColor: tierColor.border,
                }}>
                  {item.horizon.toUpperCase()}
                </span>
                <span style={styles.tierLabel}>{item.tier}</span>
              </span>
              
              {/* Direction */}
              <span style={styles.colDir}>
                <span style={{ color: dirIcon.color, fontWeight: '700', fontSize: '16px' }}>
                  {dirIcon.symbol}
                </span>
              </span>
              
              {/* Confidence */}
              <span style={styles.colConf}>
                <span style={{
                  ...styles.confValue,
                  color: item.confidenceFinal > 0.5 ? '#166534' : item.confidenceFinal > 0.3 ? '#92400e' : '#991b1b',
                }}>
                  {(item.confidenceFinal * 100).toFixed(0)}%
                </span>
              </span>
              
              {/* Phase Grade */}
              <span style={styles.colPhase}>
                <span style={{
                  ...styles.gradeBadge,
                  backgroundColor: phaseGradeColor.bg,
                  color: phaseGradeColor.text,
                }}
                title={`Score: ${item.phase?.score?.toFixed(0) || 'N/A'} | Sample: ${item.phase?.sampleQuality || 'N/A'}`}
                >
                  {item.phase?.grade || '-'}
                </span>
              </span>
              
              {/* Divergence Grade */}
              <span style={styles.colDiv}>
                <span style={{
                  ...styles.gradeBadge,
                  backgroundColor: divGradeColor.bg,
                  color: divGradeColor.text,
                }}
                title={`Divergence Score: ${item.divergence?.score?.toFixed(0) || 'N/A'}`}
                >
                  {item.divergence?.grade || '-'}
                </span>
              </span>
              
              {/* Matches */}
              <span style={styles.colMatches}>
                <span style={styles.matchCount}>{item.matches?.count || 0}</span>
                {item.matches?.primary && (
                  <span style={styles.primaryMatch}>
                    {item.matches.primary.id?.slice(0, 10)}
                  </span>
                )}
              </span>
              
              {/* Weight */}
              <span style={styles.colWeight}>
                <div style={styles.weightBarContainer}>
                  <div style={{
                    ...styles.weightBar,
                    width: `${Math.min(100, item.voteWeight * 400)}%`,
                    backgroundColor: tierColor.border,
                  }} />
                </div>
                <span style={styles.weightValue}>
                  {(item.voteWeight * 100).toFixed(0)}%
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '16px',
    marginTop: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  title: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  subtitle: {
    fontSize: '10px',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  headerRow: {
    display: 'grid',
    gridTemplateColumns: '100px 50px 60px 50px 50px 100px 80px',
    gap: '8px',
    padding: '8px 4px',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '10px',
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  dataRow: {
    display: 'grid',
    gridTemplateColumns: '100px 50px 60px 50px 50px 100px 80px',
    gap: '8px',
    padding: '10px 4px',
    borderBottom: '1px solid #f3f4f6',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  colHorizon: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  colDir: {
    textAlign: 'center',
  },
  colConf: {
    textAlign: 'center',
  },
  colPhase: {
    textAlign: 'center',
  },
  colDiv: {
    textAlign: 'center',
  },
  colMatches: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  colWeight: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  horizonBadge: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '4px',
    display: 'inline-block',
  },
  tierLabel: {
    fontSize: '9px',
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  confValue: {
    fontSize: '12px',
    fontWeight: '600',
    fontFamily: 'ui-monospace, monospace',
  },
  gradeBadge: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '3px',
    cursor: 'help',
  },
  matchCount: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
  },
  primaryMatch: {
    fontSize: '9px',
    color: '#9ca3af',
    fontFamily: 'ui-monospace, monospace',
  },
  weightBarContainer: {
    width: '40px',
    height: '6px',
    backgroundColor: '#f3f4f6',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  weightBar: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.3s',
  },
  weightValue: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#6b7280',
    fontFamily: 'ui-monospace, monospace',
    minWidth: '28px',
  },
};

export default HorizonStackView;
