import React, { useEffect, useState } from 'react';

/**
 * STRATEGY ENGINE — Clean, Institutional Panel
 * 
 * Structure:
 * - Header with preset selector
 * - 3-column grid: Decision | Position & Risk | Edge Diagnostics
 * - English tooltips for all metrics
 */

// Tooltips - English descriptions
const TOOLTIPS = {
  mode: 'Trading mode recommendation based on current market conditions.',
  regime: 'Current market regime determined by price action and volatility.',
  edge: 'Statistical edge score (0-100). Higher is better.',
  positionSize: 'Recommended position size as percentage of portfolio.',
  riskReward: 'Expected reward relative to risk. Above 1.5 is favorable.',
  expectedReturn: 'Projected return based on historical pattern analysis.',
  softStop: 'Suggested stop-loss level to limit downside.',
  tailRisk: 'Worst-case scenario loss at 95th percentile.',
  confidence: 'Model confidence in the current forecast.',
  reliability: 'Historical accuracy of similar predictions.',
  entropy: 'Measure of forecast uncertainty. Lower is better.',
  stability: 'Consistency of signal across time horizons.',
  statisticalEdge: 'Whether the model has a statistically significant advantage.',
};

// Tooltip component
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
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid #1f2937',
          }} />
        </span>
      )}
    </span>
  );
}

export function StrategyPanel({ symbol = 'BTC' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState('balanced');

  const API_URL = process.env.REACT_APP_BACKEND_URL || '';

  useEffect(() => {
    let cancelled = false;
    
    const fetchStrategy = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/fractal/v2.1/strategy?symbol=${symbol}&preset=${preset}`);
        if (cancelled) return;
        if (!res.ok) {
          setData(null);
          setLoading(false);
          return;
        }
        const json = await res.json();
        if (cancelled) return;
        setData(json);
      } catch (err) {
        if (!cancelled) console.error('[StrategyPanel] Fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    
    fetchStrategy();
    return () => { cancelled = true; };
  }, [symbol, preset, API_URL]);

  if (loading && !data) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading Strategy Engine...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Failed to load strategy data</div>
      </div>
    );
  }

  const { decision, edge, diagnostics, regime } = data;

  return (
    <div style={styles.container} data-testid="strategy-panel">
      {/* Header */}
      <div style={styles.header}>
        <Tip text="Algorithmic decision framework for position sizing and risk management.">
          <div style={styles.title}>Strategy Engine</div>
        </Tip>
        
        <PresetSelector 
          value={preset} 
          onChange={setPreset}
          loading={loading}
        />
      </div>

      {/* Main Grid - 3 Columns */}
      <div style={styles.grid}>
        {/* Left: Decision Summary */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Decision</div>
          
          <div style={styles.row}>
            <Tip text={TOOLTIPS.mode}>
              <span style={styles.label}>Mode</span>
            </Tip>
            <span style={{
              ...styles.modeBadge,
              backgroundColor: getModeColor(decision.mode)
            }}>
              {formatMode(decision.mode)}
            </span>
          </div>

          <div style={styles.row}>
            <Tip text={TOOLTIPS.regime}>
              <span style={styles.label}>Regime</span>
            </Tip>
            <span style={styles.regimeValue}>{regime}</span>
          </div>

          <div style={styles.row}>
            <Tip text={TOOLTIPS.edge}>
              <span style={styles.label}>Edge Score</span>
            </Tip>
            <span style={{ ...styles.value, color: getEdgeColor(edge.grade) }}>
              {edge.score}/100
            </span>
          </div>
        </div>

        {/* Middle: Position & Risk */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Position & Risk</div>
          
          <div style={styles.row}>
            <Tip text={TOOLTIPS.positionSize}>
              <span style={styles.label}>Position Size</span>
            </Tip>
            <span style={styles.value}>{(decision.positionSize * 100).toFixed(1)}%</span>
          </div>

          <div style={styles.row}>
            <Tip text={TOOLTIPS.riskReward}>
              <span style={styles.label}>Risk/Reward</span>
            </Tip>
            <span style={{ ...styles.value, color: getRRColor(decision.riskReward) }}>
              {decision.riskReward.toFixed(2)}
            </span>
          </div>

          <div style={styles.row}>
            <Tip text={TOOLTIPS.expectedReturn}>
              <span style={styles.label}>Expected Return</span>
            </Tip>
            <span style={{
              ...styles.value,
              color: decision.expectedReturn >= 0 ? '#16a34a' : '#dc2626'
            }}>
              {decision.expectedReturn >= 0 ? '+' : ''}{(decision.expectedReturn * 100).toFixed(1)}%
            </span>
          </div>

          <div style={styles.row}>
            <Tip text={TOOLTIPS.softStop}>
              <span style={styles.label}>Stop Loss</span>
            </Tip>
            <span style={{ ...styles.value, color: '#d97706' }}>
              {(decision.softStop * 100).toFixed(1)}%
            </span>
          </div>

          <div style={styles.row}>
            <Tip text={TOOLTIPS.tailRisk}>
              <span style={styles.label}>Worst Case (5%)</span>
            </Tip>
            <span style={{ ...styles.value, color: '#dc2626' }}>
              {(decision.tailRisk * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Right: Edge Diagnostics */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Edge Diagnostics</div>
          
          <DiagnosticRow 
            label="Confidence" 
            tooltip={TOOLTIPS.confidence}
            value={diagnostics.confidence.value}
            status={diagnostics.confidence.status}
          />
          
          <DiagnosticRow 
            label="Reliability" 
            tooltip={TOOLTIPS.reliability}
            value={diagnostics.reliability.value}
            status={diagnostics.reliability.status}
          />
          
          <DiagnosticRow 
            label="Entropy" 
            tooltip={TOOLTIPS.entropy}
            value={diagnostics.entropy.value}
            status={diagnostics.entropy.status}
          />
          
          <DiagnosticRow 
            label="Stability" 
            tooltip={TOOLTIPS.stability}
            value={diagnostics.stability.value}
            status={diagnostics.stability.status}
          />

          <div style={styles.edgeStatus}>
            <Tip text={TOOLTIPS.statisticalEdge}>
              <span style={styles.label}>Statistical Edge</span>
            </Tip>
            <span style={{
              ...styles.edgeBadge,
              backgroundColor: edge.hasStatisticalEdge ? '#dcfce7' : '#fee2e2',
              color: edge.hasStatisticalEdge ? '#166534' : '#991b1b'
            }}>
              {edge.hasStatisticalEdge ? 'Valid' : 'Weak'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Preset Selector
function PresetSelector({ value, onChange, loading }) {
  const presets = [
    { key: 'conservative', label: 'Conservative' },
    { key: 'balanced', label: 'Balanced' },
    { key: 'aggressive', label: 'Aggressive' },
  ];

  return (
    <div style={styles.presetSelector}>
      {presets.map(p => (
        <button
          key={p.key}
          onClick={() => onChange(p.key)}
          disabled={loading}
          style={{
            ...styles.presetBtn,
            ...(value === p.key ? styles.presetBtnActive : {})
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

// Diagnostic Row with tooltip
function DiagnosticRow({ label, tooltip, value, status }) {
  const displayValue = `${(value * 100).toFixed(1)}%`;
  const statusColor = getStatusColor(status);

  return (
    <div style={styles.diagnosticRow}>
      <Tip text={tooltip}>
        <span style={styles.label}>{label}</span>
      </Tip>
      <div style={styles.diagnosticValue}>
        <span style={styles.value}>{displayValue}</span>
        <span style={{ ...styles.statusDot, backgroundColor: statusColor }} />
      </div>
    </div>
  );
}

// Helper functions
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

// Styles
const styles = {
  container: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '14px',
    borderBottom: '1px solid #e5e7eb',
  },

  title: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827',
  },

  presetSelector: {
    display: 'flex',
    gap: '4px',
    padding: '3px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
  },

  presetBtn: {
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    color: '#6b7280',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },

  presetBtnActive: {
    backgroundColor: '#8b5cf6',
    color: '#ffffff',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
  },

  card: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '14px',
  },

  cardTitle: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: '12px',
  },

  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },

  diagnosticRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },

  diagnosticValue: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  label: {
    fontSize: '12px',
    color: '#6b7280',
  },

  value: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#111827',
  },

  regimeValue: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
  },

  modeBadge: {
    padding: '4px 10px',
    borderRadius: '5px',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: '600',
  },

  edgeBadge: {
    padding: '4px 10px',
    borderRadius: '5px',
    fontSize: '11px',
    fontWeight: '600',
  },

  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },

  edgeStatus: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px',
    paddingTop: '10px',
    borderTop: '1px solid #e5e7eb',
  },

  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '13px',
  },

  error: {
    padding: '40px',
    textAlign: 'center',
    color: '#dc2626',
    fontSize: '13px',
  },
};
