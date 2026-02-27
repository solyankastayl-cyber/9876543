/**
 * BLOCK 57.2 — Divergence Matrix (3×3 Heatmap)
 * 
 * Canvas-based heatmap showing:
 * - Preset (Y) × Horizon (X)
 * - ΔSharpe, ΔMaxDD, ΔCAGR per cell
 * - Click to select cell
 */

import React, { useRef, useEffect } from 'react';
import { InfoTooltip, FRACTAL_TOOLTIPS } from '../InfoTooltip';

const PRESETS = ['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'];
const HORIZONS = ['7d', '14d', '30d'];

export default function DivergenceMatrix({ summary, selectedPreset, selectedHorizon, onSelect }) {
  const canvasRef = useRef(null);

  const getCellColor = (delta) => {
    if (!delta) return { bg: '#f8fafc', border: '#e2e8f0' };
    
    const sharpe = typeof delta.sharpe === 'number' ? delta.sharpe : 0;
    
    if (sharpe > 0.1) return { bg: '#dcfce7', border: '#86efac' }; // Green - Shadow better
    if (sharpe < -0.1) return { bg: '#fef2f2', border: '#fecaca' }; // Red - Active better
    return { bg: '#f8fafc', border: '#e2e8f0' }; // Gray - neutral
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = 280;
    const height = 280;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);

    const padding = { top: 30, right: 10, bottom: 10, left: 90 };
    const cellW = (width - padding.left - padding.right) / 3;
    const cellH = (height - padding.top - padding.bottom) / 3;

    // Header row (horizons)
    ctx.fillStyle = '#64748b';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    HORIZONS.forEach((h, i) => {
      const x = padding.left + cellW * i + cellW / 2;
      ctx.fillText(h, x, 18);
    });

    // Draw cells
    PRESETS.forEach((preset, row) => {
      // Row label
      ctx.fillStyle = '#64748b';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText(preset.slice(0, 4), padding.left - 8, padding.top + cellH * row + cellH / 2 + 4);

      HORIZONS.forEach((horizon, col) => {
        const x = padding.left + cellW * col;
        const y = padding.top + cellH * row;

        const cell = summary?.[preset]?.[horizon];
        const delta = cell?.delta;
        const isSelected = preset === selectedPreset && horizon === selectedHorizon;
        const colors = getCellColor(delta);

        // Cell background
        ctx.fillStyle = colors.bg;
        ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);

        // Cell border
        ctx.strokeStyle = isSelected ? '#000' : colors.border;
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(x + 2, y + 2, cellW - 4, cellH - 4);

        // Cell content
        if (delta) {
          const deltaSharpe = typeof delta.sharpe === 'number' ? delta.sharpe : 0;
          const deltaMaxDD = typeof delta.maxDD === 'number' ? delta.maxDD * 100 : 0;

          // ΔSharpe
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 12px ui-monospace';
          ctx.textAlign = 'center';
          ctx.fillText(
            `${deltaSharpe >= 0 ? '+' : ''}${deltaSharpe.toFixed(2)}`,
            x + cellW / 2,
            y + cellH / 2 - 6
          );

          // ΔMaxDD
          ctx.fillStyle = '#64748b';
          ctx.font = '10px ui-monospace';
          ctx.fillText(
            `DD: ${deltaMaxDD >= 0 ? '+' : ''}${deltaMaxDD.toFixed(1)}%`,
            x + cellW / 2,
            y + cellH / 2 + 10
          );

          // Trades count
          const trades = cell?.active?.trades || 0;
          ctx.fillStyle = '#94a3b8';
          ctx.font = '9px system-ui';
          ctx.fillText(`${trades}t`, x + cellW / 2, y + cellH - 8);
        } else {
          ctx.fillStyle = '#94a3b8';
          ctx.font = '11px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText('—', x + cellW / 2, y + cellH / 2 + 4);
        }
      });
    });

  }, [summary, selectedPreset, selectedHorizon]);

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const padding = { top: 30, left: 90 };
    const cellW = (280 - padding.left - 10) / 3;
    const cellH = (280 - padding.top - 10) / 3;

    const col = Math.floor((x - padding.left) / cellW);
    const row = Math.floor((y - padding.top) / cellH);

    if (col >= 0 && col < 3 && row >= 0 && row < 3) {
      onSelect(PRESETS[row], HORIZONS[col].replace('d', ''));
    }
  };

  return (
    <div data-testid="divergence-matrix">
      <div style={styles.header}>
        <h3 style={styles.title}>Divergence Matrix</h3>
        <InfoTooltip {...FRACTAL_TOOLTIPS.divergenceMatrix} severity="info" />
      </div>
      <p style={styles.subtitle}>Кликните по ячейке для выбора</p>
      <canvas
        ref={canvasRef}
        style={styles.canvas}
        onClick={handleClick}
      />
      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendDot, backgroundColor: '#dcfce7' }} />
          <span>Shadow лучше</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendDot, backgroundColor: '#fef2f2' }} />
          <span>Active лучше</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendDot, backgroundColor: '#f8fafc' }} />
          <span>Нейтрально</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  title: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    color: '#0f172a'
  },
  subtitle: {
    margin: '0 0 12px 0',
    fontSize: 11,
    color: '#94a3b8'
  },
  canvas: {
    cursor: 'pointer',
    borderRadius: 8
  },
  legend: {
    display: 'flex',
    gap: 12,
    marginTop: 12,
    justifyContent: 'center'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 10,
    color: '#64748b'
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
    border: '1px solid #e2e8f0'
  }
};
