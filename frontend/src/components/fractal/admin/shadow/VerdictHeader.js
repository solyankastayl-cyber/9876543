/**
 * BLOCK 57.2 — Verdict Header
 * 
 * Unified language: English titles/metrics, Russian tooltips
 */

import React from 'react';
import { InfoTooltip, FRACTAL_TOOLTIPS } from '../InfoTooltip';

const VERDICT_CONFIG = {
  'INSUFFICIENT_DATA': { color: '#64748b', bg: '#f1f5f9', label: 'INSUFFICIENT DATA' },
  'HOLD_ACTIVE': { color: '#f59e0b', bg: '#fef3c7', label: 'HOLD ACTIVE' },
  'SHADOW_OUTPERFORMS': { color: '#22c55e', bg: '#dcfce7', label: 'SHADOW OUTPERFORMS' },
  'NO_EDGE': { color: '#6b7280', bg: '#f3f4f6', label: 'NO EDGE' },
  'ACTIVE_BETTER': { color: '#ef4444', bg: '#fef2f2', label: 'ACTIVE BETTER' }
};

export default function VerdictHeader({ meta, recommendation, cellData, state, lastFetch, onRefresh }) {
  const resolved = meta?.resolvedCount || 0;
  const minRequired = 30;
  const progress = Math.min(100, (resolved / minRequired) * 100);
  const verdict = recommendation?.verdict || 'INSUFFICIENT_DATA';
  const verdictConfig = VERDICT_CONFIG[verdict] || VERDICT_CONFIG['INSUFFICIENT_DATA'];
  const score = recommendation?.shadowScore || 50;

  // Calculate delta display from cellData
  const delta = cellData?.delta || {};
  const deltaSharpe = typeof delta.sharpe === 'number' ? delta.sharpe : 0;
  const deltaMaxDD = typeof delta.maxDD === 'number' ? delta.maxDD * 100 : 0;
  const deltaCAGR = typeof delta.cagr === 'number' ? delta.cagr * 100 : 0;

  return (
    <div style={styles.container}>
      {/* Title + Refresh */}
      <div style={styles.titleRow}>
        <div>
          <h1 style={styles.title}>Shadow Divergence Analysis</h1>
          <span style={styles.subtitle}>BTC · {state.preset} · {state.horizonKey}</span>
        </div>
        <div style={styles.actions}>
          {lastFetch && (
            <span style={styles.lastUpdate}>
              Updated: {lastFetch.toLocaleTimeString()}
            </span>
          )}
          <button onClick={onRefresh} style={styles.refreshButton} title="Refresh" data-testid="refresh-btn">
            ↻
          </button>
        </div>
      </div>

      {/* Cards Row */}
      <div style={styles.cardsGrid}>
        {/* Verdict Card */}
        <div style={styles.card} data-testid="verdict-card">
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>Verdict</span>
            <InfoTooltip {...FRACTAL_TOOLTIPS.shadowVerdict} severity="info" />
          </div>
          <div style={{
            ...styles.verdictBadge,
            backgroundColor: verdictConfig.bg,
            color: verdictConfig.color
          }}>
            {verdictConfig.label}
          </div>
        </div>

        {/* Resolved Progress */}
        <div style={styles.card} data-testid="resolved-card">
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>Resolved Signals</span>
            <InfoTooltip {...FRACTAL_TOOLTIPS.resolvedSignals} severity="info" />
          </div>
          <div style={styles.progressRow}>
            <span style={styles.progressText}>{resolved} / {minRequired}</span>
          </div>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progress}%`, backgroundColor: progress >= 100 ? '#22c55e' : '#3b82f6' }} />
          </div>
          {resolved < minRequired && (
            <span style={styles.progressHint}>
              ещё {minRequired - resolved} для вердикта
            </span>
          )}
        </div>

        {/* Shadow Score */}
        <div style={styles.card} data-testid="score-card">
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>Shadow Score</span>
            <InfoTooltip {...FRACTAL_TOOLTIPS.shadowScore} severity="info" />
          </div>
          <span style={{
            ...styles.scoreValue,
            color: score >= 65 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
          }}>
            {score}/100
          </span>
        </div>

        {/* Delta Sharpe */}
        <div style={styles.card} data-testid="sharpe-card">
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>ΔSharpe</span>
            <InfoTooltip {...FRACTAL_TOOLTIPS.deltaSharpe} severity="info" />
          </div>
          <span style={{
            ...styles.deltaValue,
            color: deltaSharpe > 0.1 ? '#22c55e' : deltaSharpe < -0.1 ? '#ef4444' : '#64748b'
          }}>
            {deltaSharpe >= 0 ? '+' : ''}{deltaSharpe.toFixed(3)}
          </span>
        </div>

        {/* Delta MaxDD */}
        <div style={styles.card} data-testid="maxdd-card">
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>ΔMaxDD</span>
            <InfoTooltip {...FRACTAL_TOOLTIPS.deltaMaxDD} severity="warning" />
          </div>
          <span style={{
            ...styles.deltaValue,
            color: deltaMaxDD < -2 ? '#22c55e' : deltaMaxDD > 2 ? '#ef4444' : '#64748b'
          }}>
            {deltaMaxDD >= 0 ? '+' : ''}{deltaMaxDD.toFixed(1)}%
          </span>
        </div>

        {/* Delta CAGR */}
        <div style={styles.card} data-testid="cagr-card">
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>ΔCAGR</span>
            <InfoTooltip {...FRACTAL_TOOLTIPS.deltaCAGR} severity="info" />
          </div>
          <span style={{
            ...styles.deltaValue,
            color: deltaCAGR > 1 ? '#22c55e' : deltaCAGR < -1 ? '#ef4444' : '#64748b'
          }}>
            {deltaCAGR >= 0 ? '+' : ''}{deltaCAGR.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Recommendation Text */}
      {recommendation?.reasoning?.length > 0 && (
        <div style={styles.reasoning}>
          <span style={styles.reasoningTitle}>Рекомендация системы:</span>
          {recommendation.reasoning.map((r, i) => (
            <span key={i} style={styles.reasonItem}>• {r}</span>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    padding: 20,
    marginBottom: 24
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: '#0f172a'
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b'
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 12
  },
  lastUpdate: {
    fontSize: 11,
    color: '#94a3b8'
  },
  refreshButton: {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    backgroundColor: '#fff',
    fontSize: 16,
    cursor: 'pointer',
    color: '#64748b'
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: 12,
    marginBottom: 16
  },
  card: {
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    border: '1px solid #e2e8f0'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  cardLabel: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  verdictBadge: {
    padding: '4px 8px',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 600,
    display: 'inline-block'
  },
  progressRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  progressText: {
    fontSize: 16,
    fontWeight: 600,
    color: '#0f172a'
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease'
  },
  progressHint: {
    fontSize: 10,
    color: '#94a3b8'
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 700
  },
  deltaValue: {
    fontSize: 16,
    fontWeight: 600,
    fontFamily: 'ui-monospace, monospace'
  },
  reasoning: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    paddingTop: 12,
    borderTop: '1px solid #e2e8f0'
  },
  reasoningTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 4
  },
  reasonItem: {
    fontSize: 12,
    color: '#64748b'
  }
};
