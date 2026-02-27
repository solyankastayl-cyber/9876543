/**
 * SPX DRIFT INTELLIGENCE TAB
 * 
 * BLOCK B6.3 — Admin UI for SPX LIVE vs Vintage Cohort Comparison
 * Shows cohort metrics, delta matrix, severity, and confidence.
 */

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// ═══════════════════════════════════════════════════════════════
// BADGES
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
    <span 
      className={`rounded-lg border-2 ${colors[severity] || colors.WATCH} ${sizes[size]}`} 
      data-testid={`severity-badge-${severity}`}
    >
      {severity}
    </span>
  );
}

function ConfidenceBadge({ confidence }) {
  const colors = {
    LOW: 'bg-gray-100 text-gray-600 border-gray-300',
    MEDIUM: 'bg-blue-50 text-blue-700 border-blue-300',
    MED: 'bg-blue-50 text-blue-700 border-blue-300',
    HIGH: 'bg-green-50 text-green-700 border-green-300',
  };
  
  return (
    <span 
      className={`px-3 py-1 text-sm rounded-lg border ${colors[confidence] || colors.LOW}`} 
      data-testid="spx-drift-confidence"
    >
      Confidence: {confidence}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// HEADER
// ═══════════════════════════════════════════════════════════════

function DriftHeader({ meta, live, onWindowChange, window }) {
  const windows = ['30d', '60d', '90d', '180d', '365d', 'all'];
  
  return (
    <div className="bg-slate-900 rounded-xl p-6" data-testid="spx-drift-header">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">B6.3 — SPX Drift Intelligence</h2>
          <p className="text-slate-400 text-sm">LIVE (2026+) vs Vintage Cohorts (1950-2025)</p>
        </div>
        
        <div className="flex items-center gap-3">
          <SeverityBadge severity={meta?.severity || 'OK'} size="lg" />
          <ConfidenceBadge confidence={meta?.confidence || 'LOW'} />
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
              window === w
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            data-testid={`spx-drift-window-${w}`}
          >
            {w}
          </button>
        ))}
      </div>
      
      {/* LIVE Warning */}
      {meta?.liveSamples === 0 && (
        <div className="bg-amber-900/30 border border-amber-500/50 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-amber-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-medium">No LIVE samples yet (2026+ data)</span>
          </div>
          <p className="text-amber-300 text-sm mt-1">
            Calibration is running on historical data. LIVE drift will be computed once 2026+ outcomes are available.
          </p>
        </div>
      )}
      
      {/* Sample Counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1">LIVE Samples</div>
          <div className={`text-2xl font-bold ${live?.samples > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {(live?.samples || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500">2026+</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1">Hit Rate</div>
          <div className="text-2xl font-bold text-blue-400">
            {live?.hitRate ? `${live.hitRate.toFixed(1)}%` : '—'}
          </div>
          <div className="text-xs text-slate-500">LIVE</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1">Expectancy</div>
          <div className="text-2xl font-bold text-purple-400">
            {live?.expectancy ? live.expectancy.toFixed(4) : '—'}
          </div>
          <div className="text-xs text-slate-500">LIVE</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1">Sharpe</div>
          <div className="text-2xl font-bold text-cyan-400">
            {live?.sharpe ? live.sharpe.toFixed(2) : '—'}
          </div>
          <div className="text-xs text-slate-500">LIVE</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COHORT COMPARISON CARDS
// ═══════════════════════════════════════════════════════════════

function CohortComparisonCard({ comparison }) {
  const cohortColors = {
    V1950: 'border-purple-500 bg-purple-500/10',
    V2020: 'border-blue-500 bg-blue-500/10',
    ALL_VINTAGE: 'border-slate-500 bg-slate-500/10',
  };
  
  const formatDelta = (val, suffix = '') => {
    if (val === undefined || val === null) return '—';
    const sign = val > 0 ? '+' : '';
    return `${sign}${val.toFixed(2)}${suffix}`;
  };
  
  const getDeltaColor = (val, inverted = false) => {
    if (val === undefined || val === null) return 'text-gray-400';
    const isGood = inverted ? val < 0 : val > 0;
    if (Math.abs(val) >= 5) return isGood ? 'text-emerald-500 font-bold' : 'text-red-500 font-bold';
    if (Math.abs(val) >= 2) return isGood ? 'text-emerald-500' : 'text-red-500';
    return 'text-gray-600';
  };
  
  return (
    <div 
      className={`rounded-xl border-2 p-4 ${cohortColors[comparison?.cohort] || 'border-gray-300'}`}
      data-testid={`spx-drift-cohort-${comparison?.cohort}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-lg">{comparison?.cohort}</span>
        <SeverityBadge severity={comparison?.severity || 'OK'} size="sm" />
      </div>
      
      {/* Vintage Metrics */}
      <div className="mb-3 pb-3 border-b border-gray-200">
        <div className="text-xs text-gray-500 mb-1">Vintage Baseline</div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Samples:</span>{' '}
            <span className="font-medium">{comparison?.vintage?.samples?.toLocaleString() || 0}</span>
          </div>
          <div>
            <span className="text-gray-500">Hit Rate:</span>{' '}
            <span className="font-medium">{comparison?.vintage?.hitRate?.toFixed(1) || 0}%</span>
          </div>
          <div>
            <span className="text-gray-500">Expectancy:</span>{' '}
            <span className="font-medium">{comparison?.vintage?.expectancy?.toFixed(4) || 0}</span>
          </div>
          <div>
            <span className="text-gray-500">Sharpe:</span>{' '}
            <span className="font-medium">{comparison?.vintage?.sharpe?.toFixed(2) || 0}</span>
          </div>
        </div>
      </div>
      
      {/* Deltas */}
      <div className="text-xs text-gray-500 mb-1">LIVE vs Vintage Delta</div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-500">Δ Hit:</span>{' '}
          <span className={getDeltaColor(comparison?.delta?.hitRate)}>
            {formatDelta(comparison?.delta?.hitRate, 'pp')}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Δ Sharpe:</span>{' '}
          <span className={getDeltaColor(comparison?.delta?.sharpe)}>
            {formatDelta(comparison?.delta?.sharpe)}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Δ Expect:</span>{' '}
          <span className={getDeltaColor(comparison?.delta?.expectancy)}>
            {formatDelta(comparison?.delta?.expectancy)}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Δ MaxDD:</span>{' '}
          <span className={getDeltaColor(comparison?.delta?.maxDD, true)}>
            {formatDelta(comparison?.delta?.maxDD, '%')}
          </span>
        </div>
      </div>
      
      {/* Notes */}
      {comparison?.notes?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500">Notes</div>
          <ul className="text-xs text-gray-600 mt-1 space-y-0.5">
            {comparison.notes.slice(0, 2).map((note, i) => (
              <li key={i}>• {note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DELTA MATRIX TABLE
// ═══════════════════════════════════════════════════════════════

function DeltaMatrixTable({ matrix }) {
  const cohorts = Object.keys(matrix?.hitRate || {});
  
  const formatVal = (val) => {
    if (val === undefined || val === null) return '—';
    const sign = val > 0 ? '+' : '';
    return `${sign}${val.toFixed(2)}`;
  };
  
  const getCellColor = (val, inverted = false) => {
    if (val === undefined || val === null) return 'bg-gray-50 text-gray-400';
    const isGood = inverted ? val < 0 : val > 0;
    if (Math.abs(val) >= 5) return isGood ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800';
    if (Math.abs(val) >= 2) return isGood ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700';
    return 'bg-white text-gray-700';
  };
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4" data-testid="spx-drift-matrix">
      <h3 className="font-bold text-gray-900 mb-4">Delta Matrix (LIVE vs Vintage)</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 font-medium text-gray-600">Metric</th>
              {cohorts.map(c => (
                <th key={c} className="text-center py-2 px-3 font-medium text-gray-600">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-2 px-3 font-medium">Δ Hit Rate (pp)</td>
              {cohorts.map(c => (
                <td key={c} className={`py-2 px-3 text-center ${getCellColor(matrix?.hitRate?.[c])}`}>
                  {formatVal(matrix?.hitRate?.[c])}
                </td>
              ))}
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2 px-3 font-medium">Δ Expectancy</td>
              {cohorts.map(c => (
                <td key={c} className={`py-2 px-3 text-center ${getCellColor(matrix?.expectancy?.[c])}`}>
                  {formatVal(matrix?.expectancy?.[c])}
                </td>
              ))}
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2 px-3 font-medium">Δ Sharpe</td>
              {cohorts.map(c => (
                <td key={c} className={`py-2 px-3 text-center ${getCellColor(matrix?.sharpe?.[c])}`}>
                  {formatVal(matrix?.sharpe?.[c])}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2 px-3 font-medium">Δ Max DD</td>
              {cohorts.map(c => (
                <td key={c} className={`py-2 px-3 text-center ${getCellColor(matrix?.maxDD?.[c], true)}`}>
                  {formatVal(matrix?.maxDD?.[c])}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SEVERITY THRESHOLDS
// ═══════════════════════════════════════════════════════════════

function SeverityThresholds() {
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4" data-testid="spx-drift-thresholds">
      <h3 className="font-bold text-gray-900 mb-3">Severity Thresholds (Deterministic)</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <SeverityBadge severity="CRITICAL" size="sm" />
          <span className="text-gray-600">
            |ΔHit| ≥ 8pp OR ΔSharpe ≤ -0.40 OR ΔExpectancy ≤ -0.010
          </span>
        </div>
        <div className="flex items-center gap-2">
          <SeverityBadge severity="WARN" size="sm" />
          <span className="text-gray-600">
            |ΔHit| ≥ 5pp OR ΔSharpe ≤ -0.25 OR ΔExpectancy ≤ -0.006
          </span>
        </div>
        <div className="flex items-center gap-2">
          <SeverityBadge severity="WATCH" size="sm" />
          <span className="text-gray-600">
            |ΔHit| ≥ 2pp OR ΔSharpe ≤ -0.10 OR ΔExpectancy ≤ -0.003
          </span>
        </div>
        <div className="flex items-center gap-2">
          <SeverityBadge severity="OK" size="sm" />
          <span className="text-gray-600">All metrics within acceptable bounds</span>
        </div>
        
        <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-gray-500">
          <strong>Confidence:</strong> LIVE &lt;30 → LOW, 30-89 → MED, ≥90 → HIGH
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function SpxDriftTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [window, setWindow] = useState('all');
  
  const fetchIntelligence = useCallback(async (w = window) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/spx/v2.1/admin/drift/intelligence?window=${w}`);
      const json = await res.json();
      if (json.ok) {
        setData(json);
        setError(null);
      } else {
        setError(json.error || 'Failed to fetch SPX drift intelligence');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [window]);
  
  useEffect(() => {
    fetchIntelligence();
  }, []);
  
  const handleWindowChange = (w) => {
    setWindow(w);
    fetchIntelligence(w);
  };
  
  const handleWriteHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/spx/v2.1/admin/drift/intelligence?window=${window}&write=1`);
      const json = await res.json();
      if (json.ok) {
        alert('Drift snapshot written to history!');
      } else {
        alert(`Error: ${json.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };
  
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading SPX drift intelligence...</span>
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
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6" data-testid="spx-drift-tab">
      {/* Header */}
      <DriftHeader 
        meta={data?.meta}
        live={data?.live}
        window={window}
        onWindowChange={handleWindowChange}
      />
      
      {/* Cohort Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {data?.comparisons?.map(comp => (
          <CohortComparisonCard key={comp.cohort} comparison={comp} />
        ))}
      </div>
      
      {/* Delta Matrix */}
      <DeltaMatrixTable matrix={data?.matrix} />
      
      {/* Thresholds + Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <SeverityThresholds />
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-bold text-gray-900 mb-3">Actions</h3>
          <div className="space-y-2">
            <button
              onClick={handleWriteHistory}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              data-testid="spx-drift-write-btn"
            >
              Write Drift Snapshot to History
            </button>
            <button
              onClick={() => fetchIntelligence(window)}
              className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              data-testid="spx-drift-refresh-btn"
            >
              Refresh Data
            </button>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
            <p><strong>Note:</strong> CRITICAL severity when LIVE samples = 0 is expected.</p>
            <p>Drift will normalize as LIVE data accumulates (2026+).</p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="text-xs text-gray-400 text-right">
        Computed at: {data?.meta?.asOf || '—'} | Symbol: {data?.meta?.symbol || 'SPX'} | Window: {data?.meta?.window || window}
      </div>
    </div>
  );
}

export default SpxDriftTab;
