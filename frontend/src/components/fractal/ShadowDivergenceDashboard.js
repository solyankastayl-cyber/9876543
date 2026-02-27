/**
 * BLOCK 57.2 — Shadow Divergence Dashboard
 * 
 * One screen, one payload, one question:
 * "Is Shadow actually better, or is it noise?"
 * 
 * 6 Blocks:
 * A) Header Summary
 * B) Equity Overlay
 * C) Divergence Matrix (3×3 heatmap)
 * D) Calibration Panel
 * E) Divergence Ledger
 * F) Governance Box
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function ShadowDivergenceDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState('BALANCED');
  const [selectedHorizon, setSelectedHorizon] = useState('7d');
  const [normalized, setNormalized] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.REACT_APP_BACKEND_URL || '';
      const res = await fetch(`${apiUrl}/api/fractal/v2.1/admin/shadow-divergence?symbol=BTC`);
      
      // Check res.ok before parsing JSON
      if (!res.ok) {
        setError(`HTTP ${res.status}`);
        return;
      }
      
      const json = await res.json();
      if (json.error) {
        setError(json.message);
      } else {
        setData(json);
        setError(null);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading && !data) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <span>Loading Shadow Divergence...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <Link to="/admin/fractal" style={styles.backLink}>← Back to Fractal Admin</Link>
        <div style={styles.error}>Error: {error}</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={styles.container}>
      {/* Back Navigation */}
      <Link to="/admin/fractal" style={styles.backLink} data-testid="back-to-admin">
        ← Back to Fractal Admin
      </Link>
      
      {/* A) Header Summary */}
      <HeaderSummary 
        meta={data.meta} 
        recommendation={data.recommendation} 
      />

      {/* B) Equity Overlay */}
      <EquityOverlay 
        equity={data.equity}
        selectedPreset={selectedPreset}
        selectedHorizon={selectedHorizon}
        normalized={normalized}
        onNormalizedChange={setNormalized}
      />

      {/* C) Divergence Matrix */}
      <DivergenceMatrix 
        summary={data.summary}
        selectedPreset={selectedPreset}
        selectedHorizon={selectedHorizon}
        onSelect={(preset, horizon) => {
          setSelectedPreset(preset);
          setSelectedHorizon(horizon);
        }}
      />

      {/* D) Calibration Panel */}
      <CalibrationPanel 
        calibration={data.calibration}
        selectedPreset={selectedPreset}
        selectedHorizon={selectedHorizon}
      />

      {/* E) Divergence Ledger */}
      <DivergenceLedger 
        ledger={data.divergenceLedger} 
      />

      {/* F) Governance Box */}
      <GovernanceBox 
        meta={data.meta}
        recommendation={data.recommendation}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// A) HEADER SUMMARY
// ═══════════════════════════════════════════════════════════════

function HeaderSummary({ meta, recommendation }) {
  const verdictColors = {
    'INSUFFICIENT_DATA': '#6b7280',
    'HOLD_ACTIVE': '#f59e0b',
    'SHADOW_OUTPERFORMS': '#22c55e'
  };

  const verdictLabels = {
    'INSUFFICIENT_DATA': 'Insufficient Data',
    'HOLD_ACTIVE': 'Hold Active',
    'SHADOW_OUTPERFORMS': 'Shadow Outperforms'
  };

  const progress = Math.min(100, (meta.resolvedCount / 30) * 100);

  return (
    <div style={styles.headerSummary}>
      <div style={styles.headerTitle}>
        <h2 style={styles.h2}>Shadow Divergence Analysis</h2>
        <span style={styles.subtitle}>BTC · Last 90 days</span>
      </div>

      <div style={styles.headerCards}>
        {/* Verdict Card */}
        <div style={styles.card}>
          <span style={styles.cardLabel}>Verdict</span>
          <span style={{
            ...styles.cardValue,
            color: verdictColors[recommendation.verdict] || '#374151'
          }}>
            {verdictLabels[recommendation.verdict] || recommendation.verdict}
          </span>
        </div>

        {/* Resolved Progress */}
        <div style={styles.card}>
          <span style={styles.cardLabel}>Resolved Signals</span>
          <div style={styles.progressContainer}>
            <span style={styles.cardValue}>{meta.resolvedCount} / 30</span>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* Shadow Score */}
        <div style={styles.card}>
          <span style={styles.cardLabel}>Shadow Score</span>
          <span style={{
            ...styles.cardValue,
            color: recommendation.shadowScore >= 65 ? '#22c55e' : 
                   recommendation.shadowScore >= 50 ? '#f59e0b' : '#ef4444'
          }}>
            {recommendation.shadowScore}/100
          </span>
        </div>

        {/* Data Sufficiency */}
        <div style={styles.card}>
          <span style={styles.cardLabel}>Data Status</span>
          <span style={{
            ...styles.cardValue,
            color: meta.dataSufficiency === 'SUFFICIENT' ? '#22c55e' : '#6b7280'
          }}>
            {meta.dataSufficiency}
          </span>
        </div>
      </div>

      {/* Reasoning */}
      {recommendation.reasoning.length > 0 && (
        <div style={styles.reasoning}>
          {recommendation.reasoning.map((r, i) => (
            <span key={i} style={styles.reasonItem}>• {r}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// B) EQUITY OVERLAY
// ═══════════════════════════════════════════════════════════════

function EquityOverlay({ equity, selectedPreset, selectedHorizon, normalized, onNormalizedChange }) {
  const canvasRef = useRef(null);
  
  const equityData = equity?.[selectedPreset]?.[selectedHorizon];
  const activeEquity = equityData?.active || [];
  const shadowEquity = equityData?.shadow || [];

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = 900;
    const height = 300;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    if (activeEquity.length === 0 && shadowEquity.length === 0) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('No equity data for this preset/horizon', width / 2, height / 2);
      return;
    }

    const allValues = [
      ...activeEquity.map(p => p.value),
      ...shadowEquity.map(p => p.value)
    ];
    
    const minVal = Math.min(...allValues) * 0.98;
    const maxVal = Math.max(...allValues) * 1.02;
    const range = maxVal - minVal || 1;

    const padding = { top: 20, right: 20, bottom: 30, left: 60 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxLen = Math.max(activeEquity.length, shadowEquity.length);
    const scaleX = (i) => padding.left + (i / (maxLen - 1 || 1)) * chartW;
    const scaleY = (v) => padding.top + chartH - ((v - minVal) / range) * chartH;

    // Draw baseline at 1.0
    ctx.beginPath();
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    const y1 = scaleY(1.0);
    ctx.moveTo(padding.left, y1);
    ctx.lineTo(width - padding.right, y1);
    ctx.stroke();

    // Draw ACTIVE line (gray)
    if (activeEquity.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 2;
      activeEquity.forEach((p, i) => {
        const x = scaleX(i);
        const y = scaleY(p.value);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Draw SHADOW line (blue)
    if (shadowEquity.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      shadowEquity.forEach((p, i) => {
        const x = scaleX(i);
        const y = scaleY(p.value);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Legend
    ctx.fillStyle = '#6b7280';
    ctx.fillRect(width - 120, 10, 12, 12);
    ctx.fillStyle = '#374151';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('ACTIVE', width - 100, 20);

    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(width - 120, 28, 12, 12);
    ctx.fillStyle = '#374151';
    ctx.fillText('SHADOW', width - 100, 38);

    // Y-axis labels
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const v = minVal + (range * i / 4);
      const y = scaleY(v);
      ctx.fillText(v.toFixed(3), padding.left - 8, y + 4);
    }

  }, [activeEquity, shadowEquity]);

  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <h3 style={styles.h3}>Equity Overlay</h3>
        <div style={styles.controls}>
          <span style={styles.controlLabel}>
            {selectedPreset} · {selectedHorizon}
          </span>
          <label style={styles.toggle}>
            <input 
              type="checkbox" 
              checked={normalized} 
              onChange={(e) => onNormalizedChange(e.target.checked)}
            />
            Normalize
          </label>
        </div>
      </div>
      <canvas ref={canvasRef} style={styles.canvas} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// C) DIVERGENCE MATRIX
// ═══════════════════════════════════════════════════════════════

function DivergenceMatrix({ summary, selectedPreset, selectedHorizon, onSelect }) {
  const presets = ['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'];
  const horizons = ['7d', '14d', '30d'];

  const getStatusColor = (delta) => {
    if (!delta) return '#e5e7eb';
    if (delta.sharpe > 0.1) return '#22c55e';
    if (delta.sharpe < -0.1) return '#ef4444';
    return '#f59e0b';
  };

  return (
    <div style={styles.section}>
      <h3 style={styles.h3}>Divergence Matrix</h3>
      <div style={styles.matrix}>
        {/* Header row */}
        <div style={styles.matrixCell} />
        {horizons.map(h => (
          <div key={h} style={styles.matrixHeader}>{h}</div>
        ))}

        {/* Data rows */}
        {presets.map(preset => (
          <React.Fragment key={preset}>
            <div style={styles.matrixRowHeader}>{preset}</div>
            {horizons.map(horizon => {
              const metrics = summary?.[preset]?.[horizon];
              const isSelected = preset === selectedPreset && horizon === selectedHorizon;
              
              return (
                <div 
                  key={`${preset}-${horizon}`}
                  style={{
                    ...styles.matrixCell,
                    backgroundColor: isSelected ? '#f3f4f6' : '#fff',
                    border: isSelected ? '2px solid #000' : '1px solid #e5e7eb',
                    cursor: 'pointer'
                  }}
                  onClick={() => onSelect(preset, horizon)}
                >
                  {metrics ? (
                    <>
                      <div style={{
                        ...styles.statusDot,
                        backgroundColor: getStatusColor(metrics.delta)
                      }} />
                      <div style={styles.matrixDelta}>
                        <span>ΔS: {metrics.delta?.sharpe || '0'}</span>
                        <span>ΔDD: {metrics.delta?.maxDD || '0'}</span>
                      </div>
                      <div style={styles.matrixTrades}>
                        {metrics.active?.trades || 0} trades
                      </div>
                    </>
                  ) : (
                    <span style={styles.noData}>—</span>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// D) CALIBRATION PANEL
// ═══════════════════════════════════════════════════════════════

function CalibrationPanel({ calibration, selectedPreset, selectedHorizon }) {
  const calData = calibration?.[selectedPreset]?.[selectedHorizon];
  const activeCal = calData?.active;
  const shadowCal = calData?.shadow;

  if (!activeCal || !shadowCal) {
    return (
      <div style={styles.section}>
        <h3 style={styles.h3}>Calibration</h3>
        <div style={styles.noData}>No calibration data available</div>
      </div>
    );
  }

  const eceDiff = (shadowCal.ece - activeCal.ece) * 100;
  const brierDiff = (shadowCal.brier - activeCal.brier) * 100;

  return (
    <div style={styles.section}>
      <h3 style={styles.h3}>Calibration ({selectedPreset} · {selectedHorizon})</h3>
      <div style={styles.calibrationGrid}>
        <div style={styles.calibrationCard}>
          <span style={styles.calibrationLabel}>ECE (Expected Calibration Error)</span>
          <div style={styles.calibrationRow}>
            <span>ACTIVE: {(activeCal.ece * 100).toFixed(2)}%</span>
            <span>SHADOW: {(shadowCal.ece * 100).toFixed(2)}%</span>
            <span style={{
              color: eceDiff < 0 ? '#22c55e' : eceDiff > 0 ? '#ef4444' : '#6b7280'
            }}>
              Δ: {eceDiff >= 0 ? '+' : ''}{eceDiff.toFixed(2)}%
            </span>
          </div>
        </div>
        <div style={styles.calibrationCard}>
          <span style={styles.calibrationLabel}>Brier Score</span>
          <div style={styles.calibrationRow}>
            <span>ACTIVE: {(activeCal.brier * 100).toFixed(2)}%</span>
            <span>SHADOW: {(shadowCal.brier * 100).toFixed(2)}%</span>
            <span style={{
              color: brierDiff < 0 ? '#22c55e' : brierDiff > 0 ? '#ef4444' : '#6b7280'
            }}>
              Δ: {brierDiff >= 0 ? '+' : ''}{brierDiff.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// E) DIVERGENCE LEDGER
// ═══════════════════════════════════════════════════════════════

function DivergenceLedger({ ledger }) {
  if (!ledger || ledger.length === 0) {
    return (
      <div style={styles.section}>
        <h3 style={styles.h3}>Divergence Ledger</h3>
        <div style={styles.noData}>No divergent decisions recorded yet</div>
      </div>
    );
  }

  return (
    <div style={styles.section}>
      <h3 style={styles.h3}>Divergence Ledger (Last {ledger.length})</h3>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Preset</th>
              <th style={styles.th}>Horizon</th>
              <th style={styles.th}>Active</th>
              <th style={styles.th}>Shadow</th>
              <th style={styles.th}>Realized</th>
              <th style={styles.th}>Winner</th>
            </tr>
          </thead>
          <tbody>
            {ledger.map((row, i) => (
              <tr key={i}>
                <td style={styles.td}>{row.asofDate}</td>
                <td style={styles.td}>{row.preset}</td>
                <td style={styles.td}>{row.horizon}</td>
                <td style={{
                  ...styles.td,
                  color: row.activeAction === 'LONG' ? '#22c55e' : 
                         row.activeAction === 'SHORT' ? '#ef4444' : '#6b7280'
                }}>
                  {row.activeAction} ({(row.activeSize * 100).toFixed(0)}%)
                </td>
                <td style={{
                  ...styles.td,
                  color: row.shadowAction === 'LONG' ? '#22c55e' : 
                         row.shadowAction === 'SHORT' ? '#ef4444' : '#6b7280'
                }}>
                  {row.shadowAction} ({(row.shadowSize * 100).toFixed(0)}%)
                </td>
                <td style={{
                  ...styles.td,
                  color: row.realizedReturn >= 0 ? '#22c55e' : '#ef4444'
                }}>
                  {(row.realizedReturn * 100).toFixed(2)}%
                </td>
                <td style={{
                  ...styles.td,
                  fontWeight: 600,
                  color: row.winner === 'SHADOW' ? '#3b82f6' : 
                         row.winner === 'ACTIVE' ? '#6b7280' : '#9ca3af'
                }}>
                  {row.winner}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// F) GOVERNANCE BOX
// ═══════════════════════════════════════════════════════════════

function GovernanceBox({ meta, recommendation }) {
  const canAct = meta.dataSufficiency === 'SUFFICIENT';

  return (
    <div style={styles.section}>
      <h3 style={styles.h3}>Governance Actions</h3>
      
      {!canAct && (
        <div style={styles.warning}>
          <span style={styles.warningIcon}>⚠️</span>
          <span>Governance actions are disabled until 30+ signals are resolved. Current: {meta.resolvedCount}</span>
        </div>
      )}

      <div style={styles.governanceButtons}>
        <button 
          style={{
            ...styles.button,
            ...styles.buttonPrimary,
            opacity: canAct ? 1 : 0.5,
            cursor: canAct ? 'pointer' : 'not-allowed'
          }}
          disabled={!canAct}
        >
          Create Promotion Proposal
        </button>
        <button 
          style={{
            ...styles.button,
            ...styles.buttonSecondary,
            opacity: canAct ? 1 : 0.5,
            cursor: canAct ? 'pointer' : 'not-allowed'
          }}
          disabled={!canAct}
        >
          Freeze Shadow
        </button>
        <button 
          style={{
            ...styles.button,
            ...styles.buttonDanger,
            opacity: canAct ? 1 : 0.5,
            cursor: canAct ? 'pointer' : 'not-allowed'
          }}
          disabled={!canAct}
        >
          Archive Shadow
        </button>
      </div>

      <div style={styles.auditNote}>
        <span>All governance actions are logged and require manual confirmation.</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = {
  container: {
    padding: 24,
    backgroundColor: '#f8fafc',
    minHeight: '100vh'
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    padding: '8px 16px',
    backgroundColor: '#fff',
    color: '#3b82f6',
    textDecoration: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    border: '1px solid #e2e8f0',
    transition: 'all 0.15s ease'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
    gap: 16,
    color: '#6b7280'
  },
  spinner: {
    width: 32,
    height: 32,
    border: '3px solid #e5e7eb',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loading: {
    padding: 40,
    textAlign: 'center',
    color: '#6b7280'
  },
  error: {
    padding: 20,
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: 8
  },
  
  // Header Summary
  headerSummary: {
    marginBottom: 32,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 16
  },
  headerTitle: {
    marginBottom: 16
  },
  h2: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: '#111'
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280'
  },
  headerCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
    marginBottom: 16
  },
  card: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8
  },
  cardLabel: {
    display: 'block',
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 600,
    color: '#111'
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    transition: 'width 0.3s ease'
  },
  reasoning: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },
  reasonItem: {
    fontSize: 12,
    color: '#6b7280'
  },

  // Sections
  section: {
    marginBottom: 32,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  h3: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: '#111'
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: 16
  },
  controlLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: 500
  },
  toggle: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: '#374151',
    cursor: 'pointer'
  },
  canvas: {
    width: '100%',
    maxWidth: 900,
    border: '1px solid #e5e7eb',
    borderRadius: 8
  },
  noData: {
    padding: 20,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 13
  },

  // Matrix
  matrix: {
    display: 'grid',
    gridTemplateColumns: '120px repeat(3, 1fr)',
    gap: 8
  },
  matrixHeader: {
    padding: 8,
    textAlign: 'center',
    fontWeight: 600,
    fontSize: 12,
    color: '#374151'
  },
  matrixRowHeader: {
    padding: 8,
    fontWeight: 500,
    fontSize: 11,
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center'
  },
  matrixCell: {
    padding: 12,
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    minHeight: 80
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%'
  },
  matrixDelta: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontSize: 11,
    color: '#374151'
  },
  matrixTrades: {
    fontSize: 10,
    color: '#9ca3af'
  },

  // Calibration
  calibrationGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 16
  },
  calibrationCard: {
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8
  },
  calibrationLabel: {
    display: 'block',
    fontSize: 12,
    fontWeight: 500,
    marginBottom: 8,
    color: '#374151'
  },
  calibrationRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 13
  },

  // Table
  tableContainer: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 12
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    borderBottom: '2px solid #e5e7eb',
    color: '#6b7280',
    fontWeight: 500,
    whiteSpace: 'nowrap'
  },
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid #f3f4f6',
    whiteSpace: 'nowrap'
  },

  // Governance
  warning: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 13,
    color: '#92400e'
  },
  warningIcon: {
    fontSize: 16
  },
  governanceButtons: {
    display: 'flex',
    gap: 12,
    marginBottom: 16
  },
  button: {
    padding: '10px 20px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    border: 'none',
    transition: 'all 0.15s ease'
  },
  buttonPrimary: {
    backgroundColor: '#000',
    color: '#fff'
  },
  buttonSecondary: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #e5e7eb'
  },
  buttonDanger: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca'
  },
  auditNote: {
    fontSize: 11,
    color: '#9ca3af'
  }
};
