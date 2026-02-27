/**
 * BLOCK 56.5 — Forward Performance Panel
 * 
 * Displays forward-truth equity curve and metrics.
 * Shows real performance from resolved signal snapshots.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

const PRESETS = ['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'];
const HORIZONS = [7, 14, 30];
const ROLES = ['ACTIVE', 'SHADOW'];

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function ForwardPerformancePanel() {
  const [preset, setPreset] = useState('BALANCED');
  const [horizon, setHorizon] = useState(7);
  const [role, setRole] = useState('ACTIVE');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const apiUrl = process.env.REACT_APP_BACKEND_URL || '';
        const url = `${apiUrl}/api/fractal/v2.1/admin/forward-equity?symbol=BTC&preset=${preset}&horizon=${horizon}&role=${role}`;
        
        const res = await fetch(url, { signal: controller.signal });
        
        if (cancelled) return;
        
        // Check res.ok BEFORE calling res.json()
        if (!res.ok) {
          setError(`HTTP ${res.status}`);
          setData(null);
          return;
        }
        
        const json = await res.json();
        
        if (cancelled) return;
        
        if (json.error) {
          setError(json.message || json.error);
          setData(null);
        } else {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (!cancelled && err.name !== 'AbortError') {
          setError(err.message || 'Failed to fetch');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [preset, horizon, role]);

  return (
    <div className="forward-performance-panel" style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.title}>Forward Performance</h3>
        <span style={styles.subtitle}>Real returns from resolved signals</span>
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        <Selector 
          label="Preset" 
          options={PRESETS} 
          value={preset} 
          onChange={setPreset} 
        />
        <Selector 
          label="Horizon" 
          options={HORIZONS} 
          value={horizon} 
          onChange={(v) => setHorizon(Number(v))} 
        />
        <Selector 
          label="Role" 
          options={ROLES} 
          value={role} 
          onChange={setRole}
          colors={{ ACTIVE: '#22c55e', SHADOW: '#6366f1' }}
        />
      </div>

      {/* Error */}
      {error && (
        <div style={styles.error}>Error: {error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div style={styles.loading}>Loading...</div>
      )}

      {/* Content */}
      {data && !loading && (
        <>
          {/* Summary */}
          <div style={styles.summary}>
            <span>Snapshots: {data.summary?.snapshots || 0}</span>
            <span>Resolved: {data.summary?.resolved || 0}</span>
            <span>Period: {data.summary?.firstDate || 'N/A'} → {data.summary?.lastDate || 'N/A'}</span>
          </div>

          {/* Equity Chart */}
          {data.equity && data.equity.length > 0 ? (
            <EquityChart data={data} />
          ) : (
            <div style={styles.noData}>
              <span style={styles.noDataIcon}>📊</span>
              <span>No resolved trades yet for {horizon}d horizon</span>
              <span style={styles.noDataHint}>Wait for {horizon} days after snapshot to see results</span>
            </div>
          )}

          {/* Metrics Grid */}
          <MetricsGrid metrics={data.metrics} />

          {/* Returns Distribution */}
          {data.returns && data.returns.length > 1 && (
            <DistributionChart returns={data.returns} />
          )}

          {/* Ledger Table */}
          {data.ledger && data.ledger.length > 0 && (
            <LedgerTable ledger={data.ledger.slice(-10)} />
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SELECTOR COMPONENT
// ═══════════════════════════════════════════════════════════════

function Selector({ label, options, value, onChange, colors = {} }) {
  return (
    <div style={styles.selector}>
      <span style={styles.selectorLabel}>{label}</span>
      <div style={styles.selectorOptions}>
        {options.map((opt) => {
          const isActive = String(opt) === String(value);
          const color = colors[opt] || (isActive ? '#000' : '#666');
          return (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              style={{
                ...styles.selectorButton,
                backgroundColor: isActive ? color : '#f3f4f6',
                color: isActive ? '#fff' : '#374151',
                borderColor: isActive ? color : '#e5e7eb'
              }}
            >
              {typeof opt === 'number' ? `${opt}D` : opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EQUITY CHART (Canvas)
// ═══════════════════════════════════════════════════════════════

function EquityChart({ data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data?.equity?.length) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = 800;
    const height = 250;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const equity = data.equity;
    const values = equity.map(p => p.value);
    const minVal = Math.min(...values) * 0.98;
    const maxVal = Math.max(...values) * 1.02;
    const range = maxVal - minVal || 1;

    const padding = { top: 20, right: 20, bottom: 30, left: 60 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const scaleX = (i) => padding.left + (i / (equity.length - 1 || 1)) * chartW;
    const scaleY = (v) => padding.top + chartH - ((v - minVal) / range) * chartH;

    // Draw baseline at 1.0
    ctx.beginPath();
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    const y1 = scaleY(1.0);
    ctx.moveTo(padding.left, y1);
    ctx.lineTo(width - padding.right, y1);
    ctx.stroke();

    // Draw equity line
    ctx.beginPath();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    
    equity.forEach((p, i) => {
      const x = scaleX(i);
      const y = scaleY(p.value);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill area
    ctx.lineTo(scaleX(equity.length - 1), scaleY(1.0));
    ctx.lineTo(scaleX(0), scaleY(1.0));
    ctx.closePath();
    ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
    ctx.fill();

    // Draw axis labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'right';
    
    // Y-axis labels
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const v = minVal + (range * i / yTicks);
      const y = scaleY(v);
      ctx.fillText(v.toFixed(3), padding.left - 8, y + 4);
    }

    // X-axis labels (first and last)
    ctx.textAlign = 'center';
    if (equity.length > 0) {
      ctx.fillText(equity[0].t, scaleX(0), height - 8);
      if (equity.length > 1) {
        ctx.fillText(equity[equity.length - 1].t, scaleX(equity.length - 1), height - 8);
      }
    }

  }, [data]);

  return (
    <div style={styles.chartContainer}>
      <canvas ref={canvasRef} style={styles.canvas} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// METRICS GRID
// ═══════════════════════════════════════════════════════════════

function MetricsGrid({ metrics }) {
  if (!metrics) return null;

  const items = [
    { label: 'CAGR', value: metrics.cagrFormatted, color: metrics.cagr > 0 ? '#22c55e' : '#ef4444' },
    { label: 'Sharpe', value: metrics.sharpe?.toFixed(2), color: metrics.sharpe > 1 ? '#22c55e' : '#374151' },
    { label: 'Max DD', value: metrics.maxDDFormatted, color: metrics.maxDD > 25 ? '#ef4444' : '#374151' },
    { label: 'Win Rate', value: metrics.winRateFormatted, color: metrics.winRate < 45 ? '#f59e0b' : '#22c55e' },
    { label: 'Expectancy', value: metrics.expectancyFormatted, color: '#374151' },
    { label: 'Profit Factor', value: metrics.profitFactor?.toFixed(2), color: '#374151' },
    { label: 'Volatility', value: metrics.volatilityFormatted, color: '#374151' },
    { label: 'Trades', value: metrics.trades, color: '#374151' }
  ];

  return (
    <div style={styles.metricsGrid}>
      {items.map((item) => (
        <div key={item.label} style={styles.metricCard}>
          <span style={styles.metricLabel}>{item.label}</span>
          <span style={{ ...styles.metricValue, color: item.color }}>
            {item.value ?? 'N/A'}
          </span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DISTRIBUTION CHART
// ═══════════════════════════════════════════════════════════════

function DistributionChart({ returns }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !returns?.length) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 400;
    const height = 120;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    // Build histogram
    const bins = 15;
    const min = Math.min(...returns);
    const max = Math.max(...returns);
    const step = (max - min) / bins || 0.001;

    const hist = Array(bins).fill(0);
    returns.forEach((r) => {
      const idx = Math.min(bins - 1, Math.floor((r - min) / step));
      hist[idx]++;
    });

    const maxCount = Math.max(...hist);
    const barWidth = width / bins - 2;

    hist.forEach((count, i) => {
      const x = i * (width / bins);
      const barH = maxCount > 0 ? (count / maxCount) * (height - 20) : 0;
      
      // Color: green for positive returns, red for negative
      const midPoint = bins / 2;
      ctx.fillStyle = i >= midPoint ? '#22c55e' : '#ef4444';
      ctx.fillRect(x, height - barH - 10, barWidth, barH);
    });

    // Zero line
    const zeroX = ((0 - min) / (max - min)) * width;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(zeroX, 0);
    ctx.lineTo(zeroX, height - 10);
    ctx.stroke();

  }, [returns]);

  return (
    <div style={styles.distributionContainer}>
      <span style={styles.distributionLabel}>Return Distribution</span>
      <canvas ref={canvasRef} style={{ width: '100%', maxWidth: 400 }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LEDGER TABLE
// ═══════════════════════════════════════════════════════════════

function LedgerTable({ ledger }) {
  return (
    <div style={styles.ledgerContainer}>
      <span style={styles.ledgerTitle}>Recent Trades</span>
      <table style={styles.ledgerTable}>
        <thead>
          <tr>
            <th style={styles.th}>Date</th>
            <th style={styles.th}>Action</th>
            <th style={styles.th}>Exposure</th>
            <th style={styles.th}>Return</th>
            <th style={styles.th}>PnL</th>
            <th style={styles.th}>Equity</th>
          </tr>
        </thead>
        <tbody>
          {ledger.map((row, i) => (
            <tr key={i}>
              <td style={styles.td}>{row.asofDate}</td>
              <td style={{
                ...styles.td,
                color: row.action === 'LONG' ? '#22c55e' : row.action === 'SHORT' ? '#ef4444' : '#6b7280'
              }}>
                {row.action}
              </td>
              <td style={styles.td}>{(row.exposure * 100).toFixed(0)}%</td>
              <td style={styles.td}>{(row.realizedReturn * 100).toFixed(2)}%</td>
              <td style={{
                ...styles.td,
                color: row.pnl >= 0 ? '#22c55e' : '#ef4444'
              }}>
                {(row.pnl * 100).toFixed(3)}%
              </td>
              <td style={styles.td}>{row.equityAfter.toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = {
  container: {
    marginTop: 40,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 12
  },
  header: {
    marginBottom: 20
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    margin: 0,
    color: '#111'
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280'
  },
  controls: {
    display: 'flex',
    gap: 24,
    marginBottom: 24,
    flexWrap: 'wrap'
  },
  selector: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  selectorLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: 500
  },
  selectorOptions: {
    display: 'flex',
    gap: 4
  },
  selectorButton: {
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 500,
    border: '1px solid',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  error: {
    padding: 12,
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: 8,
    marginBottom: 16
  },
  loading: {
    padding: 20,
    textAlign: 'center',
    color: '#6b7280'
  },
  summary: {
    display: 'flex',
    gap: 20,
    marginBottom: 16,
    fontSize: 13,
    color: '#6b7280'
  },
  chartContainer: {
    marginBottom: 24
  },
  canvas: {
    width: '100%',
    maxWidth: 800,
    border: '1px solid #e5e7eb',
    borderRadius: 8
  },
  noData: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 24,
    gap: 8
  },
  noDataIcon: {
    fontSize: 32
  },
  noDataHint: {
    fontSize: 12,
    color: '#9ca3af'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
    marginBottom: 24
  },
  metricCard: {
    display: 'flex',
    flexDirection: 'column',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8
  },
  metricLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 600
  },
  distributionContainer: {
    marginBottom: 24
  },
  distributionLabel: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 8,
    color: '#374151'
  },
  ledgerContainer: {
    marginTop: 24
  },
  ledgerTitle: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 8,
    color: '#374151'
  },
  ledgerTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 12
  },
  th: {
    textAlign: 'left',
    padding: '8px 12px',
    borderBottom: '1px solid #e5e7eb',
    color: '#6b7280',
    fontWeight: 500
  },
  td: {
    padding: '8px 12px',
    borderBottom: '1px solid #f3f4f6'
  }
};
