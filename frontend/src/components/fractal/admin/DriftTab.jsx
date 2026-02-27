/**
 * BLOCK 81 — Drift Intelligence Tab (Institutional Grade)
 * 
 * Admin UI for LIVE vs V2014/V2020 drift comparison.
 * Shows cohort metrics, delta matrix, severity, and recommended actions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// ═══════════════════════════════════════════════════════════════
// SEVERITY & CONFIDENCE BADGES
// ═══════════════════════════════════════════════════════════════

function SeverityBadge({ severity, size = 'md' }) {
  const colors = {
    OK: 'bg-emerald-100 text-emerald-800 border-emerald-400',
    WATCH: 'bg-sky-100 text-sky-800 border-sky-400',
    WARN: 'bg-amber-100 text-amber-800 border-amber-400',
    CRITICAL: 'bg-red-100 text-red-800 border-red-400',
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-5 py-2 text-lg font-bold',
  };
  
  return (
    <span className={`rounded-lg border-2 ${colors[severity] || colors.WATCH} ${sizes[size]}`} data-testid={`severity-badge-${severity}`}>
      {severity}
    </span>
  );
}

function ConfidenceBadge({ confidence }) {
  const colors = {
    LOW: 'bg-gray-100 text-gray-600 border-gray-300',
    MED: 'bg-blue-50 text-blue-700 border-blue-300',
    HIGH: 'bg-green-50 text-green-700 border-green-300',
  };
  
  return (
    <span className={`px-3 py-1 text-sm rounded-lg border ${colors[confidence] || colors.LOW}`} data-testid="confidence-badge">
      Confidence: {confidence}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// DRIFT HEADER (Verdict Bar)
// ═══════════════════════════════════════════════════════════════

function DriftHeader({ verdict, meta, windowDays, onWindowChange }) {
  const windows = [30, 60, 90, 180, 365];
  
  return (
    <div className="bg-slate-900 rounded-xl p-6" data-testid="drift-header">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">BLOCK 81 — Drift Intelligence</h2>
          <p className="text-slate-400 text-sm">LIVE vs V2020/V2014 Cohort Comparison</p>
        </div>
        
        <div className="flex items-center gap-3">
          <SeverityBadge severity={verdict?.severity || 'WATCH'} size="lg" />
          <ConfidenceBadge confidence={verdict?.confidence || 'LOW'} />
        </div>
      </div>
      
      {/* Window Selector */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-slate-400 text-sm">Window:</span>
        {windows.map(w => (
          <button
            key={w}
            onClick={() => onWindowChange(w)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              windowDays === w
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            data-testid={`window-btn-${w}`}
          >
            {w}d
          </button>
        ))}
      </div>
      
      {/* Reasons Chips */}
      {verdict?.reasons && verdict.reasons.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {verdict.reasons.map((reason, i) => (
            <span key={i} className="px-3 py-1 bg-slate-700 text-slate-300 text-xs rounded-full">
              {reason}
            </span>
          ))}
        </div>
      )}
      
      {/* Insufficient LIVE Truth Warning */}
      {verdict?.insufficientLiveTruth && (
        <div className="bg-amber-900/30 border border-amber-500/50 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-amber-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-medium">Insufficient LIVE samples (&lt;30)</span>
          </div>
          <p className="text-amber-300 text-sm mt-1">
            Drift metrics are based on bootstrap data. Governance APPLY is locked until ≥30 LIVE outcomes.
          </p>
        </div>
      )}
      
      {/* Sample Counts */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1">LIVE Samples</div>
          <div className={`text-2xl font-bold ${meta?.liveSamples > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {(meta?.liveSamples || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500">
            {meta?.liveSamples >= 30 ? 'Unlock OK' : `Need ${30 - (meta?.liveSamples || 0)} more`}
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1">V2020 Samples</div>
          <div className="text-2xl font-bold text-blue-400">
            {(meta?.v2020Samples || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500">Modern Historical</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1">V2014 Samples</div>
          <div className="text-2xl font-bold text-purple-400">
            {(meta?.v2014Samples || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500">Vintage Historical</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COHORT SNAPSHOT CARDS
// ═══════════════════════════════════════════════════════════════

function CohortCard({ cohort, isPrimary }) {
  const cohortColors = {
    LIVE: 'border-emerald-500 bg-emerald-500/10',
    V2020: 'border-blue-500 bg-blue-500/10',
    V2014: 'border-purple-500 bg-purple-500/10',
  };
  
  const metrics = cohort?.metrics || {};
  
  const formatPct = (val) => val !== undefined ? `${(val * 100).toFixed(1)}%` : '—';
  const formatNum = (val, decimals = 2) => val !== undefined ? val.toFixed(decimals) : '—';
  
  return (
    <div className={`rounded-xl border-2 p-4 ${cohortColors[cohort?.cohortId] || 'border-gray-300'}`} data-testid={`cohort-card-${cohort?.cohortId}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">{cohort?.cohortId}</span>
          {isPrimary && (
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded">Primary</span>
          )}
        </div>
        <span className="text-gray-500 text-sm">{metrics.samples?.toLocaleString() || 0} samples</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <MetricCell label="Hit Rate" value={formatPct(metrics.hitRate)} />
        <MetricCell label="Sharpe" value={formatNum(metrics.sharpe)} />
        <MetricCell label="Expectancy" value={formatPct(metrics.expectancy)} />
        <MetricCell label="Max DD" value={formatPct(metrics.maxDD)} />
        <MetricCell label="Profit Factor" value={formatNum(metrics.profitFactor)} />
        <MetricCell label="Calibration Err" value={formatPct(metrics.calibrationError)} />
      </div>
      
      {/* Coverage */}
      {cohort?.coverage && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500 mb-1">Coverage</div>
          <div className="flex flex-wrap gap-1">
            {cohort.coverage.horizons?.slice(0, 4).map(h => (
              <span key={h} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{h}</span>
            ))}
            {cohort.coverage.regimes?.slice(0, 3).map(r => (
              <span key={r} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{r}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCell({ label, value }) {
  return (
    <div className="bg-white/50 rounded p-2">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-semibold text-gray-900">{value}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DELTA MATRIX
// ═══════════════════════════════════════════════════════════════

function DeltaMatrix({ deltas }) {
  const pairs = [
    { key: 'LIVE_vs_V2020', label: 'LIVE → V2020', subtitle: 'vs Modern Baseline' },
    { key: 'LIVE_vs_V2014', label: 'LIVE → V2014', subtitle: 'vs Vintage Baseline' },
    { key: 'V2020_vs_V2014', label: 'V2020 → V2014', subtitle: 'Baseline Gap' },
  ];
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4" data-testid="delta-matrix">
      <h3 className="font-bold text-gray-900 mb-4">Delta Matrix (Cohort Comparisons)</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 font-medium text-gray-600">Comparison</th>
              <th className="text-center py-2 px-3 font-medium text-gray-600">Δ HitRate</th>
              <th className="text-center py-2 px-3 font-medium text-gray-600">Δ Sharpe</th>
              <th className="text-center py-2 px-3 font-medium text-gray-600">Δ Calibration</th>
              <th className="text-center py-2 px-3 font-medium text-gray-600">Δ MaxDD</th>
            </tr>
          </thead>
          <tbody>
            {pairs.map(({ key, label, subtitle }) => {
              const d = deltas?.[key];
              return (
                <tr key={key} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-3">
                    <div className="font-medium">{label}</div>
                    <div className="text-xs text-gray-500">{subtitle}</div>
                  </td>
                  <DeltaCell value={d?.dHitRate_pp} suffix="pp" />
                  <DeltaCell value={d?.dSharpe} />
                  <DeltaCell value={d?.dCalibration_pp} suffix="pp" />
                  <DeltaCell value={d?.dMaxDD_pp} suffix="pp" inverted />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DeltaCell({ value, suffix = '', inverted = false }) {
  if (value === undefined || value === null) {
    return <td className="py-3 px-3 text-center text-gray-400">—</td>;
  }
  
  const absVal = Math.abs(value);
  let colorClass = 'text-gray-700';
  
  // For most metrics: positive = good (green), negative = bad (red)
  // For MaxDD: positive = worse (red), negative = better (green)
  const isGood = inverted ? value < 0 : value > 0;
  const isBad = inverted ? value > 0 : value < 0;
  
  if (absVal >= 5) {
    colorClass = isGood ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold';
  } else if (absVal >= 2) {
    colorClass = isGood ? 'text-emerald-600' : 'text-red-500';
  }
  
  const sign = value > 0 ? '+' : '';
  
  return (
    <td className={`py-3 px-3 text-center ${colorClass}`}>
      {sign}{value.toFixed(2)}{suffix}
    </td>
  );
}

// ═══════════════════════════════════════════════════════════════
// SEVERITY LADDER (Rule Explainer)
// ═══════════════════════════════════════════════════════════════

function SeverityLadder({ thresholds }) {
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4" data-testid="severity-ladder">
      <h3 className="font-bold text-gray-900 mb-3">Severity Thresholds (Deterministic)</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <SeverityBadge severity="CRITICAL" size="sm" />
          <span className="text-gray-600">
            |ΔHit| ≥ {thresholds?.CRITICAL?.hitRate_pp || 8}pp OR |ΔSharpe| ≥ {thresholds?.CRITICAL?.sharpe || 0.8} OR |ΔCalib| ≥ {thresholds?.CRITICAL?.calibration_pp || 8}pp
          </span>
        </div>
        <div className="flex items-center gap-2">
          <SeverityBadge severity="WARN" size="sm" />
          <span className="text-gray-600">
            |ΔHit| ≥ {thresholds?.WARN?.hitRate_pp || 5}pp OR |ΔSharpe| ≥ {thresholds?.WARN?.sharpe || 0.5} OR |ΔCalib| ≥ {thresholds?.WARN?.calibration_pp || 5}pp
          </span>
        </div>
        <div className="flex items-center gap-2">
          <SeverityBadge severity="WATCH" size="sm" />
          <span className="text-gray-600">
            |ΔHit| ≥ {thresholds?.WATCH?.hitRate_pp || 2}pp OR |ΔSharpe| ≥ {thresholds?.WATCH?.sharpe || 0.2} OR |ΔCalib| ≥ {thresholds?.WATCH?.calibration_pp || 2}pp
          </span>
        </div>
        <div className="flex items-center gap-2">
          <SeverityBadge severity="OK" size="sm" />
          <span className="text-gray-600">All metrics within acceptable bounds</span>
        </div>
        
        <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-gray-500">
          <strong>Confidence Gating:</strong> LIVE &lt;30 → LOW, 30-89 → MED, ≥90 → HIGH. LOW confidence caps severity at WATCH.
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ACTIONS PANEL
// ═══════════════════════════════════════════════════════════════

function ActionsPanel({ verdict, onAction }) {
  const actions = verdict?.recommendedActions || [];
  
  const actionLabels = {
    NO_ACTION_REQUIRED: { label: 'No Action Required', color: 'bg-gray-100 text-gray-700' },
    CONTINUE_MONITORING: { label: 'Continue Monitoring', color: 'bg-blue-100 text-blue-700' },
    ACCUMULATE_LIVE_DATA: { label: 'Accumulate LIVE Data', color: 'bg-amber-100 text-amber-700' },
    FREEZE_POLICY_CHANGES: { label: 'Freeze Policy Changes', color: 'bg-red-100 text-red-700' },
    INVESTIGATE_ROOT_CAUSE: { label: 'Investigate Root Cause', color: 'bg-red-100 text-red-700' },
    INVESTIGATE_DRIFT_SOURCE: { label: 'Investigate Drift Source', color: 'bg-amber-100 text-amber-700' },
    REVIEW_TIER_WEIGHTS: { label: 'Review Tier Weights', color: 'bg-amber-100 text-amber-700' },
    MONITOR_NEXT_7_DAYS: { label: 'Monitor Next 7 Days', color: 'bg-blue-100 text-blue-700' },
  };
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4" data-testid="actions-panel">
      <h3 className="font-bold text-gray-900 mb-3">Recommended Actions</h3>
      
      <div className="flex flex-wrap gap-2">
        {actions.map((action, i) => {
          const config = actionLabels[action] || { label: action, color: 'bg-gray-100 text-gray-700' };
          return (
            <span key={i} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${config.color}`}>
              {config.label}
            </span>
          );
        })}
      </div>
      
      {/* Quick Action Buttons */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => onAction('openGovernance')}
          className="px-4 py-2 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition-colors"
          data-testid="action-governance"
        >
          Open Governance Tab
        </button>
        <button
          onClick={() => onAction('openOps')}
          className="px-4 py-2 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition-colors"
          data-testid="action-ops"
        >
          Open Ops Tab
        </button>
        <button
          onClick={() => onAction('writeSnapshot')}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          data-testid="action-snapshot"
        >
          Write Snapshot Now
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BREAKDOWN TABLES
// ═══════════════════════════════════════════════════════════════

function BreakdownSection({ breakdowns }) {
  const [activeBreakdown, setActiveBreakdown] = useState('byTier');
  
  const tabs = [
    { id: 'byTier', label: 'By Tier' },
    { id: 'byRegime', label: 'By Regime' },
    { id: 'byDivergence', label: 'By Divergence' },
  ];
  
  const data = breakdowns?.[activeBreakdown] || [];
  const labelKey = activeBreakdown === 'byTier' ? 'tier' : activeBreakdown === 'byRegime' ? 'regime' : 'grade';
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4" data-testid="breakdown-section">
      <h3 className="font-bold text-gray-900 mb-3">Drift Breakdown</h3>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveBreakdown(tab.id)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              activeBreakdown === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            data-testid={`breakdown-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Table */}
      {data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-medium text-gray-600">Value</th>
                <th className="text-center py-2 px-3 font-medium text-gray-600">Severity</th>
                <th className="text-center py-2 px-3 font-medium text-gray-600">LIVE Samples</th>
                <th className="text-center py-2 px-3 font-medium text-gray-600">Δ Hit (vs V2020)</th>
                <th className="text-center py-2 px-3 font-medium text-gray-600">Δ Sharpe</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium">{row[labelKey] || 'UNKNOWN'}</td>
                  <td className="py-2 px-3 text-center">
                    <SeverityBadge severity={row.worstSeverity} size="sm" />
                  </td>
                  <td className="py-2 px-3 text-center">{row.live?.samples || 0}</td>
                  <DeltaCell value={row.delta_LIVE_V2020?.dHitRate_pp} suffix="pp" />
                  <DeltaCell value={row.delta_LIVE_V2020?.dSharpe} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-gray-500 text-sm py-4 text-center">No breakdown data available</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function DriftTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [windowDays, setWindowDays] = useState(90);
  const [actionStatus, setActionStatus] = useState(null);
  
  const fetchIntelligence = useCallback(async (window = windowDays) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/fractal/v2.1/admin/drift/intelligence?symbol=BTC&window=${window}`);
      const json = await res.json();
      if (json.ok) {
        setData(json);
        setError(null);
      } else {
        setError(json.error || 'Failed to fetch drift intelligence');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [windowDays]);
  
  useEffect(() => {
    fetchIntelligence();
  }, [fetchIntelligence]);
  
  const handleWindowChange = (w) => {
    setWindowDays(w);
    fetchIntelligence(w);
  };
  
  const handleAction = async (action) => {
    if (action === 'openGovernance') {
      setSearchParams({ tab: 'governance' });
    } else if (action === 'openOps') {
      setSearchParams({ tab: 'ops' });
    } else if (action === 'writeSnapshot') {
      setActionStatus('Writing snapshot...');
      try {
        const res = await fetch(`${API_BASE}/api/fractal/v2.1/admin/drift/intelligence/snapshot?symbol=BTC`, {
          method: 'POST',
        });
        const json = await res.json();
        if (json.ok) {
          setActionStatus(`Snapshot written: ${json.severity} @ ${json.date}`);
          setTimeout(() => setActionStatus(null), 3000);
        } else {
          setActionStatus(`Error: ${json.error}`);
        }
      } catch (err) {
        setActionStatus(`Error: ${err.message}`);
      }
    }
  };
  
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading drift intelligence...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-red-50 border border-red-300 rounded-xl p-4 text-red-700">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }
  
  const meta = {
    liveSamples: data?.live?.metrics?.samples || 0,
    v2020Samples: data?.baselines?.V2020?.metrics?.samples || 0,
    v2014Samples: data?.baselines?.V2014?.metrics?.samples || 0,
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6" data-testid="drift-intelligence-tab">
      {/* Action Status Toast */}
      {actionStatus && (
        <div className="fixed bottom-4 right-4 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg z-50">
          {actionStatus}
        </div>
      )}
      
      {/* Header */}
      <DriftHeader 
        verdict={data?.verdict} 
        meta={meta}
        windowDays={windowDays}
        onWindowChange={handleWindowChange}
      />
      
      {/* Cohort Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <CohortCard cohort={data?.live} isPrimary />
        <CohortCard cohort={data?.baselines?.V2020} />
        <CohortCard cohort={data?.baselines?.V2014} />
      </div>
      
      {/* Delta Matrix */}
      <DeltaMatrix deltas={data?.deltas} />
      
      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-4">
        <SeverityLadder thresholds={data?.thresholds} />
        <ActionsPanel verdict={data?.verdict} onAction={handleAction} />
      </div>
      
      {/* Breakdown Section */}
      <BreakdownSection breakdowns={data?.breakdowns} />
      
      {/* Meta Footer */}
      <div className="text-xs text-gray-400 text-right">
        Computed at: {data?.meta?.computedAt || '—'} | Engine: {data?.meta?.engineVersion || 'v2.1.0'}
      </div>
    </div>
  );
}

export default DriftTab;
