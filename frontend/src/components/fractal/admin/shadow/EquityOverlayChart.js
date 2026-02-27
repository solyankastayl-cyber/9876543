/**
 * BLOCK 57.2 — Equity Overlay Chart (Canvas)
 * 
 * Shows ACTIVE vs SHADOW equity curves.
 * Institutional-grade visualization.
 */

import React, { useRef, useEffect, useState } from 'react';
import { InfoTooltip, FRACTAL_TOOLTIPS } from '../InfoTooltip';

export default function EquityOverlayChart({ equity, state }) {
  const canvasRef = useRef(null);
  const [normalized, setNormalized] = useState(true);
  const [showDrawdown, setShowDrawdown] = useState(false);

  const activeEquity = equity?.active || [];
  const shadowEquity = equity?.shadow || [];

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = 700;
    const height = 280;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);

    // No data state
    if (activeEquity.length === 0 && shadowEquity.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('No equity data for this preset/horizon', width / 2, height / 2);
      ctx.font = '12px system-ui';
      ctx.fillText('Accumulate more resolved signals', width / 2, height / 2 + 20);
      return;
    }

    // Prepare data
    let activeData = activeEquity.map(p => p.value);
    let shadowData = shadowEquity.map(p => p.value);

    // Normalize to 1.0 if enabled
    if (normalized && activeData.length > 0) {
      const activeStart = activeData[0] || 1;
      const shadowStart = shadowData[0] || 1;
      activeData = activeData.map(v => v / activeStart);
      shadowData = shadowData.map(v => v / shadowStart);
    }

    const allValues = [...activeData, ...shadowData];
    const minVal = Math.min(...allValues) * 0.98;
    const maxVal = Math.max(...allValues) * 1.02;
    const range = maxVal - minVal || 0.1;

    const padding = { top: 30, right: 20, bottom: 40, left: 60 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxLen = Math.max(activeData.length, shadowData.length);
    const scaleX = (i) => padding.left + (i / (maxLen - 1 || 1)) * chartW;
    const scaleY = (v) => padding.top + chartH - ((v - minVal) / range) * chartH;

    // Grid lines
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH * i / 4);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    // Baseline at 1.0 (if normalized)
    if (normalized) {
      const y1 = scaleY(1.0);
      ctx.strokeStyle = '#cbd5e1';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padding.left, y1);
      ctx.lineTo(width - padding.right, y1);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw ACTIVE line (dark gray)
    if (activeData.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 2;
      activeData.forEach((v, i) => {
        const x = scaleX(i);
        const y = scaleY(v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Draw SHADOW line (blue)
    if (shadowData.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      shadowData.forEach((v, i) => {
        const x = scaleX(i);
        const y = scaleY(v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Y-axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '11px ui-monospace, monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const v = minVal + (range * (4 - i) / 4);
      const y = padding.top + (chartH * i / 4);
      ctx.fillText(v.toFixed(3), padding.left - 8, y + 4);
    }

    // Legend
    const legendY = 12;
    
    // ACTIVE legend
    ctx.fillStyle = '#374151';
    ctx.fillRect(width - 150, legendY, 12, 12);
    ctx.fillStyle = '#374151';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('ACTIVE', width - 132, legendY + 10);

    // SHADOW legend
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(width - 70, legendY, 12, 12);
    ctx.fillStyle = '#374151';
    ctx.fillText('SHADOW', width - 52, legendY + 10);

    // X-axis label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Time →', width / 2, height - 8);

  }, [activeEquity, shadowEquity, normalized, showDrawdown]);

  // Calculate metrics
  const calcFinalValue = (data) => data.length > 0 ? data[data.length - 1].value : 0;
  const activeFinal = calcFinalValue(activeEquity);
  const shadowFinal = calcFinalValue(shadowEquity);

  return (
    <div data-testid="equity-overlay">
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <h3 style={styles.title}>Equity Overlay</h3>
          <InfoTooltip {...FRACTAL_TOOLTIPS.equityOverlay} severity="info" />
        </div>
        <div style={styles.controls}>
          <label style={styles.toggle}>
            <input
              type="checkbox"
              checked={normalized}
              onChange={(e) => setNormalized(e.target.checked)}
            />
            <span>Нормализация</span>
          </label>
        </div>
      </div>

      <canvas ref={canvasRef} style={styles.canvas} />

      {/* Metrics under chart */}
      <div style={styles.metricsRow}>
        <div style={styles.metric}>
          <span style={styles.metricLabel}>Active Final</span>
          <span style={styles.metricValue}>{activeFinal.toFixed(4)}</span>
        </div>
        <div style={styles.metric}>
          <span style={styles.metricLabel}>Shadow Final</span>
          <span style={{ ...styles.metricValue, color: '#3b82f6' }}>{shadowFinal.toFixed(4)}</span>
        </div>
        <div style={styles.metric}>
          <span style={styles.metricLabel}>Выбрано</span>
          <span style={styles.metricValue}>{state.preset} · {state.horizonKey}</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  title: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    color: '#0f172a'
  },
  controls: {
    display: 'flex',
    gap: 12
  },
  toggle: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: '#64748b',
    cursor: 'pointer'
  },
  canvas: {
    width: '100%',
    maxWidth: 700,
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    backgroundColor: '#fff'
  },
  metricsRow: {
    display: 'flex',
    gap: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid #f1f5f9'
  },
  metric: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2
  },
  metricLabel: {
    fontSize: 10,
    color: '#94a3b8',
    textTransform: 'uppercase'
  },
  metricValue: {
    fontSize: 13,
    fontWeight: 600,
    color: '#0f172a',
    fontFamily: 'ui-monospace, monospace'
  }
};
