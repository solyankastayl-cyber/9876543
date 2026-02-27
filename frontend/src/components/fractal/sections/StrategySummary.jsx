/**
 * STRATEGY SUMMARY — Compact 2-Column Layout
 * 
 * Replaces 3 separate cards (Decision, Position & Risk, Edge Diagnostics)
 * with one unified compact panel.
 * 
 * Uses GLOBAL mode/horizon/execution from StrategyControlPanel
 * 
 * Supports both BTC and SPX assets with different API endpoints:
 * - BTC: /api/fractal/v2.1/strategy
 * - SPX: /api/fractal/spx/strategy (Strategy Engine v1)
 */

import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Shield, Target, Activity, Gauge, AlertTriangle, CheckCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

export function StrategySummary({ 
  symbol = 'BTC', 
  mode = 'balanced',
  horizon = '30d',  // String format from global focus (e.g., '7d', '30d', '90d')
  execution = 'ACTIVE'
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    
    const fetchStrategy = async () => {
      setLoading(true);
      try {
        // SPX uses different endpoint with horizon support
        let url;
        if (symbol === 'SPX') {
          // horizon is already a string like '30d'
          const horizonStr = horizon.includes('d') ? horizon : `${horizon}d`;
          const preset = mode.toUpperCase();
          url = `${API_URL}/api/fractal/spx/strategy?horizon=${horizonStr}&preset=${preset}`;
        } else {
          // BTC uses legacy endpoint
          url = `${API_URL}/api/fractal/v2.1/strategy?symbol=${symbol}&preset=${mode}`;
        }
        
        const res = await fetch(url);
        if (cancelled) return;
        if (!res.ok) {
          setData(null);
          setLoading(false);
          return;
        }
        const json = await res.json();
        if (cancelled) return;
        
        // Normalize response format for both assets
        if (symbol === 'SPX' && json.ok) {
          // Check if new format (has action directly) or old format (has strategy object)
          const isNewFormat = 'action' in json && typeof json.action === 'string';
          const isOldFormat = 'strategy' in json && json.strategy?.action;
          
          if (isNewFormat) {
            // NEW FORMAT: SPX Strategy Engine v1
            setData({
              isSpx: true,
              action: json.action,
              confidence: json.confidence,
              size: json.size,
              reasons: json.reasons,
              riskNotes: json.riskNotes,
              meta: json.meta,
              context: json.context,
              // Map to legacy format for compatibility
              decision: {
                mode: json.action === 'BUY' ? 'FULL' : json.action === 'REDUCE' ? 'MICRO' : 'NO_TRADE',
                positionSize: json.size,
                expectedReturn: json.meta?.forecastReturn || 0,
                riskReward: json.size > 0 ? 1.5 : 0,
                softStop: Math.abs(json.meta?.tailRisk || 0.05),
                tailRisk: json.meta?.tailRisk || -0.05,
              },
              edge: {
                score: Math.round((json.meta?.probUp || 0.5) * 100),
                grade: json.confidence === 'HIGH' ? 'STRONG' : json.confidence === 'MEDIUM' ? 'NEUTRAL' : 'WEAK',
                hasStatisticalEdge: json.confidence !== 'LOW' && json.size > 0,
              },
              diagnostics: {
                confidence: { value: json.meta?.probUp || 0.5, status: json.confidence === 'HIGH' ? 'ok' : 'warn' },
                reliability: { value: 1 - (json.meta?.entropy || 0.5), status: json.meta?.entropy < 0.5 ? 'ok' : 'warn' },
                entropy: { value: json.meta?.entropy || 0.5, status: json.meta?.entropy < 0.7 ? 'ok' : 'warn' },
                stability: { value: 0.7, status: 'ok' },
              },
              regime: json.meta?.volRegime || 'NORMAL',
            });
          } else if (isOldFormat) {
            // OLD FORMAT: Legacy SPX strategy endpoint
            const s = json.strategy;
            const mapAction = (a) => a === 'LONG' ? 'BUY' : a === 'SHORT' ? 'REDUCE' : 'HOLD';
            const confidenceLevel = s.confidence > 0.6 ? 'HIGH' : s.confidence > 0.3 ? 'MEDIUM' : 'LOW';
            
            setData({
              isSpx: true,
              action: mapAction(s.action),
              confidence: confidenceLevel,
              size: s.positionSize || 0,
              reasons: s.reasoning || [],
              riskNotes: [],
              meta: {
                forecastReturn: (s.takeProfit - s.entry) / s.entry || 0,
                probUp: s.confidence || 0.5,
                entropy: json.risk?.entropy || 0.5,
                volRegime: json.risk?.tailBadge === 'CRISIS' ? 'CRISIS' : 'NORMAL',
                phase: 'UNKNOWN',
              },
              context: null,
              decision: {
                mode: s.positionSize > 0.5 ? 'FULL' : s.positionSize > 0.1 ? 'PARTIAL' : s.positionSize > 0 ? 'MICRO' : 'NO_TRADE',
                positionSize: s.positionSize || 0,
                expectedReturn: (s.takeProfit - s.entry) / s.entry || 0,
                riskReward: s.positionSize > 0 ? (s.takeProfit - s.entry) / (s.entry - s.stopLoss) : 0,
                softStop: (s.entry - s.stopLoss) / s.entry || 0.05,
                tailRisk: json.risk?.mcP95_DD || -0.05,
              },
              edge: {
                score: Math.round((s.confidence || 0.5) * 100),
                grade: s.confidence > 0.6 ? 'STRONG' : s.confidence > 0.3 ? 'NEUTRAL' : 'WEAK',
                hasStatisticalEdge: s.confidence > 0.4 && s.positionSize > 0,
              },
              diagnostics: {
                confidence: { value: s.confidence || 0.5, status: s.confidence > 0.5 ? 'ok' : 'warn' },
                reliability: { value: json.reliability?.score || 0.5, status: json.reliability?.badge === 'STRONG' ? 'ok' : 'warn' },
                entropy: { value: json.risk?.entropy || 0.5, status: json.risk?.entropy < 0.7 ? 'ok' : 'warn' },
                stability: { value: 0.7, status: 'ok' },
              },
              regime: json.risk?.tailBadge || 'NORMAL',
            });
          } else {
            // Fallback
            setData(json);
          }
        } else {
          setData(json);
        }
      } catch (err) {
        if (!cancelled) console.error('[StrategySummary] Fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    
    fetchStrategy();
    return () => { cancelled = true; };
  }, [symbol, mode, horizon]);

  if (loading && !data) {
    return (
      <div style={styles.container} data-testid="strategy-summary">
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={styles.container} data-testid="strategy-summary">
        <div style={styles.error}>Failed to load strategy data</div>
      </div>
    );
  }

  const { decision, edge, diagnostics, regime } = data;

  return (
    <div style={styles.container} data-testid="strategy-summary">
      {/* Header row */}
      <div style={styles.headerRow}>
        <div style={styles.headerLeft}>
          <span style={styles.sectionTitle}>Strategy Summary</span>
          <span style={styles.modeTag}>{mode.charAt(0).toUpperCase() + mode.slice(1)} · {horizon}D · {execution}</span>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={styles.twoColumns}>
        {/* Left Column - Decision & Position */}
        <div style={styles.column}>
          {/* Decision */}
          <div style={styles.metricRow}>
            <span style={styles.metricLabel}>
              <Activity size={14} style={{ marginRight: 6, color: '#6b7280' }} />
              Mode
            </span>
            <span style={{
              ...styles.modeBadge,
              color: getModeColor(decision.mode),
            }}>
              {formatMode(decision.mode)}
            </span>
          </div>

          <div style={styles.metricRow}>
            <span style={styles.metricLabel}>Regime</span>
            <span style={styles.metricValue}>{regime}</span>
          </div>

          <div style={styles.metricRow}>
            <span style={styles.metricLabel}>
              <Gauge size={14} style={{ marginRight: 6, color: '#6b7280' }} />
              Edge Score
            </span>
            <span style={{
              ...styles.metricValue,
              color: getEdgeColor(edge.grade),
              fontWeight: '700',
            }}>
              {edge.score} / 100
            </span>
          </div>

          <div style={styles.separator} />

          {/* Position & Risk */}
          <div style={styles.metricRow}>
            <span style={styles.metricLabel}>Position Size</span>
            <span style={styles.metricValue}>{(decision.positionSize * 100).toFixed(1)}%</span>
          </div>

          <div style={styles.metricRow}>
            <span style={styles.metricLabel}>Expected Return</span>
            <span style={{
              ...styles.metricValue,
              color: decision.expectedReturn >= 0 ? '#16a34a' : '#dc2626',
            }}>
              {decision.expectedReturn >= 0 ? '+' : ''}{(decision.expectedReturn * 100).toFixed(1)}%
            </span>
          </div>

          <div style={styles.metricRow}>
            <span style={styles.metricLabel}>Risk/Reward</span>
            <span style={{
              ...styles.metricValue,
              color: getRRColor(decision.riskReward),
            }}>
              {decision.riskReward.toFixed(2)}
            </span>
          </div>

          <div style={styles.metricRow}>
            <span style={styles.metricLabel}>
              <AlertTriangle size={14} style={{ marginRight: 6, color: '#dc2626' }} />
              Worst Case
            </span>
            <span style={{ ...styles.metricValue, color: '#dc2626' }}>
              {(decision.tailRisk * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Right Column - Diagnostics */}
        <div style={styles.column}>
          <DiagnosticItem 
            label="Confidence"
            value={diagnostics.confidence.value}
            status={diagnostics.confidence.status}
          />
          <DiagnosticItem 
            label="Reliability"
            value={diagnostics.reliability.value}
            status={diagnostics.reliability.status}
          />
          <DiagnosticItem 
            label="Entropy"
            value={diagnostics.entropy.value}
            status={diagnostics.entropy.status}
            inverted
          />
          <DiagnosticItem 
            label="Stability"
            value={diagnostics.stability.value}
            status={diagnostics.stability.status}
          />

          <div style={styles.separator} />

          {/* Statistical Edge */}
          <div style={styles.metricRow}>
            <span style={styles.metricLabel}>
              <Shield size={14} style={{ marginRight: 6, color: '#6b7280' }} />
              Statistical Edge
            </span>
            <span style={{
              ...styles.edgeBadge,
              color: edge.hasStatisticalEdge ? '#166534' : '#991b1b',
            }}>
              {edge.hasStatisticalEdge ? 'Valid' : 'Weak'}
            </span>
          </div>
        </div>
      </div>
      
      {/* SPX Strategy Engine v1 - Action + Why/Risks */}
      {data.isSpx && (data.reasons?.length > 0 || data.riskNotes?.length > 0) && (
        <div style={styles.spxSection}>
          {/* Action Badge - Large, prominent */}
          <div style={styles.spxActionRow}>
            <div style={{
              ...styles.spxActionBadge,
              backgroundColor: data.action === 'BUY' ? '#dcfce7' : data.action === 'REDUCE' ? '#fef2f2' : '#f1f5f9',
              color: data.action === 'BUY' ? '#166534' : data.action === 'REDUCE' ? '#991b1b' : '#475569',
              borderColor: data.action === 'BUY' ? '#86efac' : data.action === 'REDUCE' ? '#fecaca' : '#e2e8f0',
            }}>
              {data.action === 'BUY' ? <TrendingUp size={20} /> : data.action === 'REDUCE' ? <TrendingDown size={20} /> : <Shield size={20} />}
              <span style={{ marginLeft: 10, fontWeight: 700, fontSize: 18 }}>{data.action}</span>
              <span style={{ marginLeft: 8, fontSize: 13, opacity: 0.7 }}>{data.confidence}</span>
            </div>
            <div style={styles.spxSizeBox}>
              <span style={styles.spxSizeLabel}>Position</span>
              <span style={{ 
                fontWeight: 700, 
                fontSize: 20,
                color: data.size > 0.5 ? '#166534' : data.size > 0.2 ? '#d97706' : '#64748b' 
              }}>
                {data.size === 0 ? 'NONE' : `${(data.size * 100).toFixed(0)}%`}
              </span>
            </div>
          </div>
          
          {/* Two-column: Why | Risks */}
          <div style={styles.spxGrid}>
            {/* Why Column */}
            <div style={styles.spxWhyColumn}>
              <div style={styles.spxColumnHeader}>
                <CheckCircle size={14} style={{ color: '#16a34a' }} />
                <span>Why</span>
              </div>
              {data.reasons?.length > 0 ? (
                <ul style={styles.spxBulletList}>
                  {data.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              ) : (
                <span style={styles.spxEmpty}>No signals</span>
              )}
            </div>
            
            {/* Risks Column */}
            <div style={styles.spxRisksColumn}>
              <div style={styles.spxColumnHeader}>
                <AlertTriangle size={14} style={{ color: '#d97706' }} />
                <span>Risks</span>
              </div>
              {data.riskNotes?.length > 0 ? (
                <ul style={styles.spxBulletList}>
                  {data.riskNotes.map((r, i) => (
                    <li key={i} style={{ color: '#92400e' }}>{r}</li>
                  ))}
                </ul>
              ) : (
                <span style={styles.spxEmpty}>No warnings</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DiagnosticItem({ label, value, status, inverted = false }) {
  const pct = (value * 100).toFixed(1);
  const color = getStatusColor(status);
  
  return (
    <div style={styles.metricRow}>
      <span style={styles.metricLabel}>{label}</span>
      <div style={styles.diagnosticValue}>
        <span style={styles.metricValue}>{pct}%</span>
        <span style={{
          ...styles.statusDot,
          backgroundColor: color,
        }} />
      </div>
    </div>
  );
}

function formatMode(mode) {
  const modes = {
    'FULL': 'Full Position',
    'PARTIAL': 'Partial',
    'MICRO': 'Micro',
    'NO_TRADE': 'No Trade',
  };
  return modes[mode] || mode;
}

function getModeColor(mode) {
  switch (mode) {
    case 'FULL': return '#16a34a';
    case 'PARTIAL': return '#d97706';
    case 'MICRO': return '#3b82f6';
    case 'NO_TRADE': return '#6b7280';
    default: return '#6b7280';
  }
}

function getEdgeColor(grade) {
  switch (grade) {
    case 'INSTITUTIONAL': return '#16a34a';
    case 'STRONG': return '#22c55e';
    case 'NEUTRAL': return '#d97706';
    case 'WEAK': return '#dc2626';
    default: return '#6b7280';
  }
}

function getRRColor(rr) {
  if (rr >= 2) return '#16a34a';
  if (rr >= 1) return '#d97706';
  return '#dc2626';
}

function getStatusColor(status) {
  switch (status) {
    case 'ok': return '#16a34a';
    case 'warn': return '#d97706';
    case 'block': return '#dc2626';
    default: return '#6b7280';
  }
}

const styles = {
  container: {
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '16px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
    paddingBottom: '12px',
    borderBottom: '1px solid #f3f4f6',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827',
  },
  modeTag: {
    display: 'none', // Hidden - remove badge
  },
  twoColumns: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  metricRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0',
  },
  metricLabel: {
    fontSize: '12px',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#111827',
  },
  diagnosticValue: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  modeBadge: {
    padding: '0',
    borderRadius: '0',
    backgroundColor: 'transparent',
    fontSize: '11px',
    fontWeight: '600',
  },
  edgeBadge: {
    padding: '0',
    borderRadius: '0',
    backgroundColor: 'transparent',
    fontSize: '11px',
    fontWeight: '600',
  },
  separator: {
    height: '1px',
    backgroundColor: '#f3f4f6',
    margin: '6px 0',
  },
  loading: {
    padding: '30px',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '13px',
  },
  error: {
    padding: '30px',
    textAlign: 'center',
    color: '#dc2626',
    fontSize: '13px',
  },
  // SPX Strategy Engine v1 - Clean, readable styles
  spxSection: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '2px solid #e5e7eb',
  },
  spxActionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  spxActionBadge: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 20px',
    borderRadius: '10px',
    border: '2px solid',
  },
  spxSizeBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  spxSizeLabel: {
    fontSize: '11px',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  spxGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  spxWhyColumn: {
    padding: '14px',
    backgroundColor: '#f0fdf4',
    borderRadius: '10px',
    border: '1px solid #bbf7d0',
  },
  spxRisksColumn: {
    padding: '14px',
    backgroundColor: '#fffbeb',
    borderRadius: '10px',
    border: '1px solid #fde68a',
  },
  spxColumnHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '10px',
  },
  spxBulletList: {
    margin: 0,
    padding: '0 0 0 18px',
    listStyle: 'disc',
    fontSize: '13px',
    lineHeight: '1.6',
    color: '#166534',
  },
  spxEmpty: {
    fontSize: '12px',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
};

export default StrategySummary;
