/**
 * BLOCK 76.1 — Consensus Pulse Strip Component
 * 
 * Terminal header component showing 7-day consensus dynamics:
 * - Mini sparkline chart
 * - Consensus index with delta
 * - Sync state indicator
 * - Divergence grade
 * - Structural lock days
 */

import React from 'react';
import { useConsensusPulse, SYNC_STATE_CONFIG, DIVERGENCE_GRADE_CONFIG } from '../../hooks/useConsensusPulse';

/**
 * Mini sparkline component
 */
const Sparkline = ({ series, width = 120, height = 32 }) => {
  if (!series || series.length === 0) {
    return (
      <div 
        style={{ width, height, background: '#f1f5f9', borderRadius: 4 }}
        className="flex items-center justify-center"
      >
        <span style={{ color: '#94a3b8', fontSize: 10 }}>No data</span>
      </div>
    );
  }

  const values = series.map(p => p.consensusIndex);
  const min = Math.min(...values) - 5;
  const max = Math.max(...values) + 5;
  const range = max - min || 1;

  // Build SVG path
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1 || 1)) * (width - 4) + 2;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;

  // Determine line color based on trend
  const first = values[0];
  const last = values[values.length - 1];
  const lineColor = last > first + 2 ? '#16a34a' : last < first - 2 ? '#dc2626' : '#6b7280';

  // Fill gradient
  const fillPoints = [...points, `${width - 2},${height - 2}`, `2,${height - 2}`];
  const fillD = `M ${fillPoints.join(' L ')} Z`;

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="sparkFill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill="url(#sparkFill)" />
      <path d={pathD} fill="none" stroke={lineColor} strokeWidth="1.5" />
      {/* Current value dot */}
      {values.length > 0 && (
        <circle
          cx={width - 4}
          cy={height - ((last - min) / range) * (height - 8) - 4}
          r="3"
          fill={lineColor}
        />
      )}
    </svg>
  );
};

/**
 * Sync state badge
 */
const SyncBadge = ({ syncState }) => {
  const config = SYNC_STATE_CONFIG[syncState] || SYNC_STATE_CONFIG.NEUTRAL;
  
  return (
    <span
      data-testid="sync-state-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 600,
        backgroundColor: config.bg,
        color: config.color,
      }}
    >
      {syncState === 'STRUCTURAL_DOMINANCE' && (
        <span style={{ fontSize: 10 }}>🔒</span>
      )}
      {config.label}
    </span>
  );
};

/**
 * Divergence grade badge
 */
const DivergenceBadge = ({ grade, score }) => {
  const config = DIVERGENCE_GRADE_CONFIG[grade] || DIVERGENCE_GRADE_CONFIG.C;
  
  return (
    <span
      data-testid="divergence-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        backgroundColor: '#f8fafc',
        color: config.color,
      }}
    >
      Div: {grade}
      <span style={{ color: '#94a3b8', fontWeight: 400 }}>({score})</span>
    </span>
  );
};

/**
 * Consensus Pulse Strip - Main Component
 */
export function ConsensusPulseStrip({ symbol = 'BTC' }) {
  const { data, loading, error } = useConsensusPulse(symbol, 7);

  if (loading && !data) {
    return (
      <div style={styles.container} data-testid="consensus-pulse-strip">
        <div style={styles.loadingState}>
          <div style={styles.loadingBar} />
          <span style={{ color: '#94a3b8', fontSize: 12 }}>Loading pulse...</span>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={styles.container} data-testid="consensus-pulse-strip">
        <span style={{ color: '#ef4444', fontSize: 12 }}>Pulse unavailable</span>
      </div>
    );
  }

  if (!data) return null;

  const { series, summary } = data;
  const { current, delta7d, avgStructuralWeight, lockDays, syncState } = summary;

  // Get last divergence grade from series
  const lastPoint = series[series.length - 1];
  const divergenceGrade = lastPoint?.divergenceGrade || 'C';
  const divergenceScore = lastPoint?.divergenceScore || 50;

  // Delta color
  const deltaColor = delta7d > 0 ? '#16a34a' : delta7d < 0 ? '#dc2626' : '#6b7280';
  const deltaSign = delta7d > 0 ? '+' : '';

  return (
    <div style={styles.container} data-testid="consensus-pulse-strip">
      {/* Sparkline */}
      <div style={styles.sparklineWrapper}>
        <Sparkline series={series} width={100} height={28} />
      </div>

      {/* Consensus Index */}
      <div style={styles.metricBlock}>
        <span style={styles.metricLabel}>Consensus</span>
        <div style={styles.metricValue}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>{current}</span>
          <span style={{ color: deltaColor, fontSize: 12, marginLeft: 4 }}>
            {deltaSign}{delta7d}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Sync State */}
      <div style={styles.metricBlock}>
        <span style={styles.metricLabel}>Sync</span>
        <SyncBadge syncState={syncState} />
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Structural Weight */}
      <div style={styles.metricBlock}>
        <span style={styles.metricLabel}>Struct Weight</span>
        <span style={styles.metricValueSmall}>{avgStructuralWeight}%</span>
      </div>

      {/* Lock Days (if any) */}
      {lockDays > 0 && (
        <>
          <div style={styles.divider} />
          <div style={styles.metricBlock}>
            <span style={styles.metricLabel}>Lock Days</span>
            <span style={{ ...styles.metricValueSmall, color: '#7c3aed' }}>
              🔒 {lockDays}/7
            </span>
          </div>
        </>
      )}

      {/* Divider */}
      <div style={styles.divider} />

      {/* Divergence */}
      <div style={styles.metricBlock}>
        <DivergenceBadge grade={divergenceGrade} score={divergenceScore} />
      </div>

      {/* Loading indicator overlay */}
      {loading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingDot} />
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '8px 16px',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    position: 'relative',
    minHeight: 48,
  },
  loadingState: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  loadingBar: {
    width: 100,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  sparklineWrapper: {
    flexShrink: 0,
  },
  metricBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: 500,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  metricValue: {
    display: 'flex',
    alignItems: 'baseline',
  },
  metricValueSmall: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1e293b',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: '#e2e8f0',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 4,
    right: 8,
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    animation: 'pulse 1.5s infinite',
  },
};

export default ConsensusPulseStrip;
