/**
 * P1.4 — Volatility Regime Card
 * 
 * Displays volatility intelligence:
 * - Current regime (LOW/NORMAL/HIGH/EXPANSION/CRISIS)
 * - RV30/RV90 metrics
 * - Risk modifier applied
 * 
 * Institutional desk-style, minimal design.
 */

import React from 'react';

const REGIME_COLORS = {
  LOW: { bg: '#dcfce7', text: '#166534', label: 'Low Vol' },
  NORMAL: { bg: '#f3f4f6', text: '#374151', label: 'Normal' },
  HIGH: { bg: '#fef3c7', text: '#92400e', label: 'High Vol' },
  EXPANSION: { bg: '#fee2e2', text: '#991b1b', label: 'Expansion' },
  CRISIS: { bg: '#fecaca', text: '#7f1d1d', label: 'Crisis' },
};

export function VolatilityCard({ volatility }) {
  if (!volatility) {
    return (
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.title}>VOLATILITY</span>
        </div>
        <div style={styles.noData}>No data</div>
      </div>
    );
  }

  const {
    regime,
    rv30,
    rv90,
    volZScore,
    atrPercentile,
    policy,
    applied,
  } = volatility;

  const regimeStyle = REGIME_COLORS[regime] || REGIME_COLORS.NORMAL;

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.title}>VOLATILITY</span>
        <div 
          style={{
            ...styles.badge,
            backgroundColor: regimeStyle.bg,
            color: regimeStyle.text,
          }}
        >
          {regimeStyle.label}
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={styles.metricsGrid}>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>RV30</div>
          <div style={styles.metricValue}>{(rv30 * 100).toFixed(1)}%</div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>RV90</div>
          <div style={styles.metricValue}>{(rv90 * 100).toFixed(1)}%</div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Z-Score</div>
          <div style={{
            ...styles.metricValue,
            color: volZScore > 1 ? '#dc2626' : volZScore < -1 ? '#16a34a' : '#374151'
          }}>
            {volZScore >= 0 ? '+' : ''}{volZScore.toFixed(2)}
          </div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>ATR Pctl</div>
          <div style={styles.metricValue}>{(atrPercentile * 100).toFixed(0)}%</div>
        </div>
      </div>

      {/* Impact Section */}
      <div style={styles.impactSection}>
        <div style={styles.impactTitle}>Risk Modifier</div>
        <div style={styles.impactGrid}>
          <div style={styles.impactItem}>
            <span style={styles.impactLabel}>Size</span>
            <span style={{
              ...styles.impactValue,
              color: policy.sizeMultiplier < 1 ? '#dc2626' : policy.sizeMultiplier > 1 ? '#16a34a' : '#374151'
            }}>
              ×{policy.sizeMultiplier.toFixed(2)}
            </span>
          </div>
          <div style={styles.impactItem}>
            <span style={styles.impactLabel}>Conf</span>
            <span style={{
              ...styles.impactValue,
              color: policy.confidencePenaltyPp > 0 ? '#dc2626' : '#374151'
            }}>
              {policy.confidencePenaltyPp > 0 ? `-${(policy.confidencePenaltyPp * 100).toFixed(0)}pp` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Applied Effect (if available) */}
      {applied && applied.sizeBefore !== applied.sizeAfter && (
        <div style={styles.appliedSection}>
          <div style={styles.appliedText}>
            Size: {(applied.sizeBefore * 100).toFixed(1)}% → {(applied.sizeAfter * 100).toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '16px',
    height: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  title: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  badge: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  noData: {
    color: '#9ca3af',
    fontSize: '13px',
    textAlign: 'center',
    padding: '20px 0',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    marginBottom: '12px',
  },
  metric: {
    display: 'flex',
    flexDirection: 'column',
  },
  metricLabel: {
    fontSize: '10px',
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'ui-monospace, monospace',
  },
  impactSection: {
    borderTop: '1px solid #f3f4f6',
    paddingTop: '10px',
  },
  impactTitle: {
    fontSize: '10px',
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginBottom: '6px',
  },
  impactGrid: {
    display: 'flex',
    gap: '16px',
  },
  impactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  impactLabel: {
    fontSize: '11px',
    color: '#6b7280',
  },
  impactValue: {
    fontSize: '13px',
    fontWeight: '600',
    fontFamily: 'ui-monospace, monospace',
  },
  appliedSection: {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px dashed #e5e7eb',
  },
  appliedText: {
    fontSize: '11px',
    color: '#6b7280',
    fontFamily: 'ui-monospace, monospace',
  },
};

export default VolatilityCard;
