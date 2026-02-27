/**
 * MARKET PHASE ENGINE — Only Historical Phase Performance
 * 
 * Removed: Current Forecast Influence (moved to Consensus)
 */

import React, { useEffect, useState, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// Phase colors
const PHASE_COLORS = {
  ACCUMULATION: '#22c55e',
  MARKUP: '#3b82f6',
  DISTRIBUTION: '#f59e0b',
  MARKDOWN: '#ec4899',
  RECOVERY: '#06b6d4',
  CAPITULATION: '#ef4444',
};

// Phase descriptions - ENGLISH
const PHASE_TOOLTIPS = {
  ACCUMULATION: 'Accumulation phase — smart money builds positions after prolonged decline.',
  MARKUP: 'Markup phase — active uptrend. Price rises on high volume.',
  DISTRIBUTION: 'Distribution phase — smart money takes profits at market top.',
  MARKDOWN: 'Markdown phase — active downtrend. Market panic.',
  RECOVERY: 'Recovery phase — early reversal signs after decline.',
  CAPITULATION: 'Capitulation — mass panic, often marks cycle bottom.',
};

const HEADER_TOOLTIPS = {
  successRate: 'Percentage of times price increased during this phase historically.',
  avgReturn: 'Average return during this phase period.',
  riskLevel: 'Risk level based on volatility and drawdowns.',
};

const getRisk = (avgRet, hitRate) => {
  if (hitRate > 0.55 && avgRet > 0.02) return { label: 'Low', color: '#16a34a', bg: '#dcfce7' };
  if (hitRate > 0.45 && avgRet > 0) return { label: 'Medium', color: '#d97706', bg: '#fef3c7' };
  return { label: 'High', color: '#dc2626', bg: '#fee2e2' };
};

const RISK_TOOLTIPS = {
  Low: 'Low risk — stable phase, high probability of positive outcome.',
  Medium: 'Medium risk — moderate uncertainty.',
  High: 'High risk — high volatility, significant losses possible.',
};

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

export function MarketPhaseEngine({ tier = 'TACTICAL' }) {
  const [phases, setPhases] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/fractal/v2.1/admin/phase-performance?symbol=BTC&tier=${tier}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.ok) {
        setPhases(data.phases || []);
        setError(null);
      } else {
        throw new Error(data.error || 'Failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tier]);
  
  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div style={styles.loading}>Loading phase data...</div>;
  if (error) return <div style={styles.error}>{error}</div>;
  if (!phases?.length) return <div style={styles.empty}>No data</div>;

  return (
    <div style={styles.container} data-testid="market-phase-engine">
      <div style={styles.header}>
        <Tip text="Analyzes historical price behavior across different market phases.">
          <span style={styles.title}>Market Phase Engine</span>
        </Tip>
      </div>
      
      <div style={styles.content}>
        <div style={styles.columnHeader}>Historical Phase Performance</div>
        
        {/* Table Header */}
        <div style={styles.tableHeader}>
          <span style={styles.colPhase}>Phase</span>
          <Tip text={HEADER_TOOLTIPS.successRate}>
            <span style={styles.colCenter}>Success Rate</span>
          </Tip>
          <Tip text={HEADER_TOOLTIPS.avgReturn}>
            <span style={styles.colCenter}>Avg Return</span>
          </Tip>
          <Tip text={HEADER_TOOLTIPS.riskLevel}>
            <span style={styles.colCenter}>Risk Level</span>
          </Tip>
        </div>
        
        {/* Rows */}
        {phases.map((p) => {
          const risk = getRisk(p.avgRet, p.hitRate);
          const phaseColor = PHASE_COLORS[p.phaseName] || '#6b7280';
          
          return (
            <div key={p.phaseId || p.phaseName} style={styles.tableRow}>
              <span style={styles.colPhase}>
                <Tip text={PHASE_TOOLTIPS[p.phaseName]}>
                  <span style={{ ...styles.phaseBadge, color: phaseColor }}>
                    {p.phaseName}
                  </span>
                </Tip>
              </span>
              <span style={styles.colCenter}>
                <span style={{ ...styles.statValue, color: p.hitRate > 0.5 ? '#16a34a' : '#dc2626' }}>
                  {(p.hitRate * 100).toFixed(0)}%
                </span>
              </span>
              <span style={styles.colCenter}>
                <span style={{ ...styles.statValue, color: p.avgRet >= 0 ? '#16a34a' : '#dc2626' }}>
                  {p.avgRet >= 0 ? '+' : ''}{(p.avgRet * 100).toFixed(1)}%
                </span>
              </span>
              <span style={styles.colCenter}>
                <Tip text={RISK_TOOLTIPS[risk.label]}>
                  <span style={{ ...styles.riskBadge, color: risk.color }}>
                    {risk.label}
                  </span>
                </Tip>
              </span>
            </div>
          );
        })}
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
    height: '100%',
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
  content: {
    padding: '16px 20px',
  },
  columnHeader: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '12px',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '130px 1fr 1fr 90px',
    gap: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '11px',
    fontWeight: '500',
    color: '#9ca3af',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '130px 1fr 1fr 90px',
    gap: '12px',
    padding: '10px 0',
    borderBottom: '1px solid #f3f4f6',
    alignItems: 'center',
  },
  colPhase: {
    display: 'flex',
    alignItems: 'center',
  },
  colCenter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseBadge: {
    color: '#fff',
    padding: '4px 10px',
    borderRadius: '0',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    backgroundColor: 'transparent !important',
  },
  statValue: {
    fontSize: '13px',
    fontWeight: '600',
  },
  riskBadge: {
    padding: '3px 10px',
    borderRadius: '0',
    fontSize: '11px',
    fontWeight: '600',
    backgroundColor: 'transparent',
    border: 'none',
  },
  loading: { fontSize: '13px', color: '#9ca3af', padding: '20px' },
  error: { fontSize: '13px', color: '#dc2626', padding: '20px' },
  empty: { fontSize: '13px', color: '#9ca3af', padding: '20px' },
};

export default MarketPhaseEngine;
