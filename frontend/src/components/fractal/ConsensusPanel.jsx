/**
 * INSTITUTIONAL CONSENSUS — Compact Panel (3-Column Layout)
 * 
 * Clean, compact layout:
 * - Top: Index | Conflict | Resolved | Dominant (one line)
 * - Bottom: Vote by Horizon | Layer Influence | Forecast Influence
 * 
 * No technical clutter. With tooltips.
 */

import React, { useState } from 'react';

// Tooltips - English
const TOOLTIPS = {
  consensusIndex: 'Measures alignment of signals across all forecast horizons. High = strong agreement. Low = conflicting signals.',
  conflict: 'Indicates disagreement between structural, tactical and timing layers.',
  resolved: 'The final trading signal after resolving conflicts between layers.',
  dominant: 'The layer currently exerting the strongest influence on the forecast.',
  voteHorizon: 'Shows contribution of each time horizon to the overall consensus.',
  layerInfluence: 'Shows how much each analytical layer affects the current forecast.',
  forecastInfluence: 'Model weighting applied to each horizon in projection calculations.',
};

const CONFLICT_LABELS = {
  NONE: { label: 'Aligned', color: '#16a34a', bg: '#dcfce7' },
  LOW: { label: 'Low', color: '#047857', bg: '#d1fae5' },
  MODERATE: { label: 'Moderate', color: '#d97706', bg: '#fef3c7' },
  HIGH: { label: 'High', color: '#ea580c', bg: '#fed7aa' },
  SEVERE: { label: 'Severe', color: '#dc2626', bg: '#fecaca' },
};

const ACTION_COLORS = {
  BUY: { bg: '#dcfce7', color: '#166534' },
  SELL: { bg: '#fecaca', color: '#991b1b' },
  HOLD: { bg: '#f3f4f6', color: '#374151' },
};

/**
 * Tooltip Component
 */
function Tip({ children, text }) {
  const [show, setShow] = useState(false);
  
  return (
    <span 
      style={{ position: 'relative', display: 'inline-flex', cursor: 'help' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span style={{
          position: 'absolute',
          bottom: 'calc(100% + 6px)',
          left: '0',
          zIndex: 1000,
          backgroundColor: '#1f2937',
          color: '#fff',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          lineHeight: '1.4',
          width: '200px',
          textAlign: 'left',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontWeight: '400',
          whiteSpace: 'normal',
        }}>
          {text}
          <span style={{
            position: 'absolute',
            bottom: '-5px',
            left: '16px',
            width: '0',
            height: '0',
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid #1f2937',
          }} />
        </span>
      )}
    </span>
  );
}

/**
 * Main Component
 */
export function ConsensusPanel({ consensus74, horizonStack = [] }) {
  if (!consensus74) return null;
  
  const {
    consensusIndex = 50,
    conflictLevel = 'MODERATE',
    votes = [],
    resolved = {},
    adaptiveMeta = {},
  } = consensus74;
  
  const conflict = CONFLICT_LABELS[conflictLevel] || CONFLICT_LABELS.MODERATE;
  const action = ACTION_COLORS[resolved?.action] || ACTION_COLORS.HOLD;
  const dominant = resolved?.dominantTier || 'TACTICAL';
  
  // Bias label
  const bias = consensusIndex > 60 ? 'Bullish' : consensusIndex < 40 ? 'Bearish' : 'Neutral';
  const biasColor = consensusIndex > 60 ? '#16a34a' : consensusIndex < 40 ? '#dc2626' : '#6b7280';
  
  // Layer weights
  const structWeight = (adaptiveMeta?.structureWeightSum || 0) * 100;
  const tactWeight = (adaptiveMeta?.tacticalWeightSum || 0) * 100;
  const timeWeight = (adaptiveMeta?.timingWeightSum || 0) * 100;

  return (
    <div style={styles.container} data-testid="consensus-panel">
      {/* Header */}
      <div style={styles.header}>
        <Tip text={TOOLTIPS.consensusIndex}>
          <span style={styles.title}>Institutional Consensus</span>
        </Tip>
      </div>
      
      {/* Top Metrics Row */}
      <div style={styles.topRow}>
        {/* Consensus Index */}
        <Tip text={TOOLTIPS.consensusIndex}>
          <div style={styles.metric}>
            <span style={styles.metricLabel}>Index</span>
            <span style={{ ...styles.indexValue, color: biasColor }}>{consensusIndex}</span>
            <span style={{ ...styles.biasLabel, color: biasColor }}>{bias}</span>
          </div>
        </Tip>
        
        {/* Conflict */}
        <Tip text={TOOLTIPS.conflict}>
          <div style={styles.metric}>
            <span style={styles.metricLabel}>Conflict</span>
            <span style={{ ...styles.badge, color: conflict.color }}>
              {conflict.label}
            </span>
          </div>
        </Tip>
        
        {/* Resolved */}
        <Tip text={TOOLTIPS.resolved}>
          <div style={styles.metric}>
            <span style={styles.metricLabel}>Signal</span>
            <span style={{ ...styles.actionBadge, color: action.color }}>
              {resolved?.action || 'HOLD'}
            </span>
          </div>
        </Tip>
        
        {/* Dominant */}
        <Tip text={TOOLTIPS.dominant}>
          <div style={styles.metric}>
            <span style={styles.metricLabel}>Dominant</span>
            <span style={styles.dominantBadge}>{dominant}</span>
          </div>
        </Tip>
      </div>
      
      {/* Bottom Section - Three Columns */}
      <div style={styles.bottomRow}>
        {/* Vote by Horizon */}
        <div style={styles.column}>
          <Tip text={TOOLTIPS.voteHorizon}>
            <div style={styles.columnTitle}>Vote by Horizon</div>
          </Tip>
          <div style={styles.voteList}>
            {votes.slice(0, 6).map((v) => {
              const weight = (v.weight || 0) * 100;
              return (
                <div key={v.horizon} style={styles.voteItem}>
                  <span style={styles.voteLabel}>{v.horizon}</span>
                  <div style={styles.miniBarBg}>
                    <div style={{
                      ...styles.miniBar,
                      width: `${Math.min(100, weight * 3.5)}%`,
                      backgroundColor: v.contribution > 0 ? '#22c55e' : v.contribution < 0 ? '#ef4444' : '#8b5cf6',
                    }} />
                  </div>
                  <span style={styles.votePercent}>{weight.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Layer Influence */}
        <div style={styles.column}>
          <Tip text={TOOLTIPS.layerInfluence}>
            <div style={styles.columnTitle}>Layer Influence</div>
          </Tip>
          <div style={styles.layerList}>
            <div style={styles.layerItem}>
              <span style={styles.layerLabel}>Structure</span>
              <div style={styles.miniBarBg}>
                <div style={{ ...styles.miniBar, width: `${structWeight * 1.8}%`, backgroundColor: '#ef4444' }} />
              </div>
              <span style={styles.layerPercent}>{structWeight.toFixed(0)}%</span>
            </div>
            <div style={styles.layerItem}>
              <span style={styles.layerLabel}>Tactical</span>
              <div style={styles.miniBarBg}>
                <div style={{ ...styles.miniBar, width: `${tactWeight * 1.8}%`, backgroundColor: '#8b5cf6' }} />
              </div>
              <span style={styles.layerPercent}>{tactWeight.toFixed(0)}%</span>
            </div>
            <div style={styles.layerItem}>
              <span style={styles.layerLabel}>Timing</span>
              <div style={styles.miniBarBg}>
                <div style={{ ...styles.miniBar, width: `${timeWeight * 1.8}%`, backgroundColor: '#3b82f6' }} />
              </div>
              <span style={styles.layerPercent}>{timeWeight.toFixed(0)}%</span>
            </div>
          </div>
        </div>
        
        {/* Forecast Influence - NEW COLUMN */}
        <div style={styles.column}>
          <Tip text={TOOLTIPS.forecastInfluence}>
            <div style={styles.columnTitle}>Forecast Influence</div>
          </Tip>
          <div style={styles.forecastList}>
            {horizonStack.slice(0, 6).map((h) => {
              const weight = (h.voteWeight || 0) * 100;
              const tierColor = h.tier === 'STRUCTURE' ? '#ef4444' 
                : h.tier === 'TACTICAL' ? '#8b5cf6' 
                : '#3b82f6';
              return (
                <div key={h.horizon} style={styles.forecastItem}>
                  <span style={styles.forecastLabel}>{h.horizon}</span>
                  <div style={styles.miniBarBg}>
                    <div style={{ 
                      ...styles.miniBar, 
                      width: `${Math.min(100, weight * 3.5)}%`, 
                      backgroundColor: tierColor,
                    }} />
                  </div>
                  <span style={styles.forecastPercent}>{weight.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    overflow: 'visible',
    width: '100%',
  },
  header: {
    padding: '14px 20px',
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827',
  },
  
  // Top Row
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #f3f4f6',
    gap: '16px',
  },
  metric: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    flex: 1,
  },
  metricLabel: {
    fontSize: '10px',
    fontWeight: '500',
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  indexValue: {
    fontSize: '28px',
    fontWeight: '700',
    lineHeight: 1,
  },
  biasLabel: {
    fontSize: '10px',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  badge: {
    fontSize: '12px',
    fontWeight: '600',
    padding: '0',
    borderRadius: '0',
    backgroundColor: 'transparent',
    border: 'none',
    boxShadow: 'none',
    outline: 'none',
  },
  actionBadge: {
    fontSize: '13px',
    fontWeight: '700',
    padding: '0',
    borderRadius: '0',
    backgroundColor: 'transparent',
    border: 'none',
    boxShadow: 'none',
    outline: 'none',
  },
  dominantBadge: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '0',
    borderRadius: '0',
    backgroundColor: 'transparent',
    color: '#5b21b6',
    textTransform: 'uppercase',
    border: 'none',
  },
  
  // Bottom Row - Three columns
  bottomRow: {
    display: 'flex',
    padding: '16px 20px',
    gap: '20px',
  },
  column: {
    flex: 1,
    minWidth: 0,
  },
  columnTitle: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '10px',
    textTransform: 'uppercase',
  },
  
  // Vote List
  voteList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  voteItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  voteLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#374151',
    minWidth: '28px',
  },
  miniBarBg: {
    flex: 1,
    height: '6px',
    backgroundColor: '#f3f4f6',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  miniBar: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.2s',
  },
  votePercent: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#6b7280',
    minWidth: '24px',
    textAlign: 'right',
  },
  
  // Layer List
  layerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  layerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  layerLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#374151',
    minWidth: '55px',
  },
  layerPercent: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#374151',
    minWidth: '28px',
    textAlign: 'right',
  },
  
  // Forecast List (NEW)
  forecastList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  forecastItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  forecastLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#374151',
    minWidth: '32px',
  },
  forecastPercent: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#6b7280',
    minWidth: '24px',
    textAlign: 'right',
  },
};

export default ConsensusPanel;
