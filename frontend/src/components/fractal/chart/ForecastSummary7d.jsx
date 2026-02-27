import React from 'react';
import { formatPrice as formatPriceUtil } from '../../../utils/priceFormatter';

/**
 * BLOCK 72.2 — 7D Compact Text Summary
 * 
 * Minimal text line under chart:
 * 7D → BULLISH (+2.4%) | Conf: 42% | Sample: 15 | Hit: 60% | Timing: WAIT
 */

export function ForecastSummary7d({ focusPack, currentPrice, symbol = 'BTC' }) {
  if (!focusPack) return null;
  
  const { overlay } = focusPack;
  const stats = overlay?.stats || {};
  const distributionSeries = overlay?.distributionSeries || {};
  
  // Format price using centralized formatter
  const formatPrice = (p) => formatPriceUtil(p, symbol, { compact: true });
  
  // Get day 7 P50
  const p50 = distributionSeries.p50?.[distributionSeries.p50?.length - 1] ?? stats.medianReturn ?? 0;
  const p10 = distributionSeries.p10?.[distributionSeries.p10?.length - 1] ?? -0.15;
  const p90 = distributionSeries.p90?.[distributionSeries.p90?.length - 1] ?? 0.15;
  
  // Direction
  const direction = p50 > 0.005 ? 'BULLISH' : p50 < -0.005 ? 'BEARISH' : 'NEUTRAL';
  const color = direction === 'BULLISH' ? '#22c55e' : direction === 'BEARISH' ? '#ef4444' : '#6b7280';
  
  // Stats
  const sampleSize = stats.sampleSize || overlay?.matches?.length || 0;
  const hitRate = stats.hitRate ?? 0.5;
  
  // Confidence
  const dispersion = Math.abs(p90 - p10);
  const dispersionPenalty = Math.min(dispersion / Math.max(Math.abs(p50), 0.01), 1) * 0.3;
  const confidence = Math.min(100, Math.max(0, (hitRate * 100) * (1 - dispersionPenalty) * (sampleSize >= 10 ? 1 : 0.8)));
  
  // Timing
  let timing = 'WAIT';
  if (direction === 'BULLISH' && confidence > 50) timing = 'ENTER';
  else if (direction === 'BEARISH' && confidence > 50) timing = 'EXIT';
  
  const timingColor = timing === 'ENTER' ? '#22c55e' : timing === 'EXIT' ? '#ef4444' : '#f59e0b';
  
  const sign = p50 >= 0 ? '+' : '';

  return (
    <div style={styles.container}>
      <span style={styles.label}>7D →</span>
      <span style={{ ...styles.direction, color }}>{direction}</span>
      <span style={{ ...styles.pct, color }}>({sign}{(p50 * 100).toFixed(1)}%)</span>
      <span style={styles.divider}>|</span>
      <span style={styles.meta}>Conf: <strong>{confidence.toFixed(0)}%</strong></span>
      <span style={styles.divider}>|</span>
      <span style={styles.meta}>Sample: <strong>{sampleSize}</strong></span>
      <span style={styles.divider}>|</span>
      <span style={styles.meta}>Hit: <strong>{(hitRate * 100).toFixed(0)}%</strong></span>
      <span style={styles.divider}>|</span>
      <span style={styles.meta}>Timing: <strong style={{ color: timingColor }}>{timing}</strong></span>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 12px',
    marginTop: 6,
    fontSize: 12,
    color: '#666',
    backgroundColor: '#fafafa',
    borderRadius: 4,
    border: '1px solid #eee',
  },
  label: {
    fontWeight: 600,
    color: '#444',
  },
  direction: {
    fontWeight: 700,
  },
  pct: {
    fontWeight: 600,
    fontFamily: 'monospace',
  },
  divider: {
    color: '#ddd',
  },
  meta: {
    color: '#777',
    fontSize: 11,
  },
};

export default ForecastSummary7d;
