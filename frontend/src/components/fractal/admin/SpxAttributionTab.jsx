/**
 * SPX ATTRIBUTION TAB — Institutional Grade Analytics
 * 
 * BLOCK B6.2 — SPX-specific Attribution Dashboard
 * 
 * LIGHT THEME — Matches site design
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const WINDOWS = ['30d', '90d', '365d', 'all'];
const COHORTS = ['ALL', 'LIVE', 'V2020', 'V2008', 'V1990', 'V1950'];
const PRESETS = ['BALANCED', 'CONSERVATIVE', 'AGGRESSIVE'];

// ═══════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════

function MetricCard({ label, value, subtext, severity }) {
  const bgColor = {
    'good': 'bg-emerald-50 border-emerald-200',
    'warn': 'bg-amber-50 border-amber-200',
    'bad': 'bg-red-50 border-red-200',
    'neutral': 'bg-white border-gray-200'
  }[severity || 'neutral'];
  
  const textColor = {
    'good': 'text-emerald-600',
    'warn': 'text-amber-600',
    'bad': 'text-red-600',
    'neutral': 'text-gray-900'
  }[severity || 'neutral'];
  
  return (
    <div className={`p-4 rounded-lg border ${bgColor} shadow-sm`} data-testid={`metric-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-2xl font-bold ${textColor}`}>{value}</div>
      {subtext && <div className="text-xs text-gray-400 mt-1">{subtext}</div>}
    </div>
  );
}

function RiskZoneBadge({ zone }) {
  const colors = {
    'OK': 'bg-emerald-100 text-emerald-700 border-emerald-300',
    'WATCH': 'bg-amber-100 text-amber-700 border-amber-300',
    'WARN': 'bg-orange-100 text-orange-700 border-orange-300',
    'CRITICAL': 'bg-red-100 text-red-700 border-red-300',
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${colors[zone] || colors['WATCH']}`}>
      {zone}
    </span>
  );
}

function BreakdownTable({ title, data, columns, minSamples = 30 }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
        <p className="text-gray-400 text-sm">No data available</p>
      </div>
    );
  }

  const rows = Object.entries(data)
    .map(([key, metrics]) => ({ key, ...metrics }))
    .sort((a, b) => (b.samples || 0) - (a.samples || 0));

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm" data-testid={`breakdown-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(col => (
                <th key={col.key} className={`px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide ${col.align || 'text-left'}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(row => {
              const dim = (row.samples || 0) < minSamples;
              return (
                <tr key={row.key} className={`${dim ? 'opacity-50' : ''} hover:bg-gray-50 transition-colors`}>
                  {columns.map(col => (
                    <td key={col.key} className={`px-4 py-2 text-sm ${col.align || 'text-left'} ${col.mono ? 'font-mono' : ''} ${col.color?.(row) || 'text-gray-700'}`}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DiagnosticsPanel({ diagnostics }) {
  if (!diagnostics) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm" data-testid="diagnostics-panel">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Diagnostics</h3>
      
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-500 mb-1">Risk Zone</div>
          <RiskZoneBadge zone={diagnostics.riskZone || 'OK'} />
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Weakest Horizon</div>
          <div className="font-mono text-gray-700">{diagnostics.weakestHorizon || '—'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Strongest Phase</div>
          <div className="font-mono text-gray-700">{diagnostics.strongestPhase || '—'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Noise Factor</div>
          <div className="font-mono text-gray-700">{typeof diagnostics.noiseFactor === 'number' ? diagnostics.noiseFactor.toFixed(2) : '—'}</div>
        </div>
      </div>

      {diagnostics.notes?.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 mb-2">Notes</div>
          <div className="flex flex-wrap gap-2">
            {diagnostics.notes.map((note, i) => (
              <span key={i} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded border border-gray-200">
                {note}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function SpxAttributionTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const window = searchParams.get('attr_window') || 'all';
  const cohort = searchParams.get('attr_cohort') || 'ALL';
  const preset = searchParams.get('attr_preset') || 'BALANCED';
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const updateParams = (key, value) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'spx_attribution');
    params.set(key, value);
    setSearchParams(params, { replace: true });
  };
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const url = `${API_BASE}/api/spx/v2.1/admin/attribution?window=${window}&cohort=${cohort}&preset=${preset}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch SPX attribution data');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [window, cohort, preset]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Formatters
  const fmtPct = (v, digits = 1) => v != null ? `${(v * 100).toFixed(digits)}%` : '—';
  const fmtNum = (v, digits = 2) => v != null ? v.toFixed(digits) : '—';
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading SPX attribution data...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-20 bg-gray-50">
        <div className="text-center p-6 bg-red-50 rounded-xl border border-red-200 max-w-md">
          <p className="text-red-600 font-medium mb-2">Error loading attribution</p>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  const { kpis, breakdowns, diagnostics, counts, insights } = data || {};
  
  // Column definitions for tables
  const standardColumns = [
    { key: 'key', label: 'Name', mono: true },
    { key: 'samples', label: 'N', align: 'text-right', render: r => r.samples || 0 },
    { key: 'hitRate', label: 'Hit Rate', align: 'text-right', render: r => fmtPct(r.hitRate), color: r => r.hitRate > 0.55 ? 'text-emerald-600' : r.hitRate < 0.45 ? 'text-red-600' : 'text-gray-700' },
    { key: 'expectancy', label: 'Expectancy', align: 'text-right', render: r => fmtPct(r.expectancy, 2), color: r => r.expectancy > 0 ? 'text-emerald-600' : 'text-red-600' },
    { key: 'sharpe', label: 'Sharpe', align: 'text-right', render: r => fmtNum(r.sharpe) },
    { key: 'maxDD', label: 'MaxDD', align: 'text-right', render: r => fmtPct(r.maxDD), color: r => r.maxDD > 0.15 ? 'text-red-600' : 'text-gray-700' },
    { key: 'calibration', label: 'Cal', align: 'text-right', render: r => fmtNum(r.calibration) },
  ];

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6" data-testid="spx-attribution-tab">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">SPX Attribution</h2>
          <p className="text-sm text-gray-500">BLOCK B6.2 — Institutional Analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded border border-blue-200">
            SPX
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Window:</span>
            <div className="flex gap-1" data-testid="window-selector">
              {WINDOWS.map(w => (
                <button
                  key={w}
                  onClick={() => updateParams('attr_window', w)}
                  data-testid={`window-btn-${w}`}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    window === w 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Cohort:</span>
            <select
              value={cohort}
              onChange={(e) => updateParams('attr_cohort', e.target.value)}
              data-testid="cohort-select"
              className="px-3 py-1 text-sm bg-white text-gray-700 border border-gray-300 rounded"
            >
              {COHORTS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Preset:</span>
            <select
              value={preset}
              onChange={(e) => updateParams('attr_preset', e.target.value)}
              data-testid="preset-select"
              className="px-3 py-1 text-sm bg-white text-gray-700 border border-gray-300 rounded"
            >
              {PRESETS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          
          <div className="ml-auto text-sm text-gray-400" data-testid="meta-info">
            N = {kpis?.totalOutcomes || kpis?.samples || 0} outcomes
          </div>
        </div>
      </div>

      {/* No Data Warning */}
      {(kpis?.samples === 0 || kpis?.totalOutcomes === 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="font-medium text-amber-700">No Outcomes Data</div>
              <div className="text-sm text-amber-600">
                Run the calibration process to generate SPX outcomes for attribution analysis.
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          label="Samples"
          value={kpis?.totalOutcomes || kpis?.samples || 0}
          subtext="resolved outcomes"
          severity="neutral"
        />
        <MetricCard
          label="Hit Rate"
          value={fmtPct(kpis?.hitRate)}
          subtext={`Avg Return: ${fmtPct(kpis?.avgReturn || kpis?.avgRet, 2)}`}
          severity={kpis?.hitRate >= 0.55 ? 'good' : kpis?.hitRate >= 0.45 ? 'neutral' : 'bad'}
        />
        <MetricCard
          label="Expectancy"
          value={fmtPct(kpis?.expectancy, 2)}
          subtext={`Win: ${fmtPct(kpis?.avgWin, 2)} / Loss: ${fmtPct(Math.abs(kpis?.avgLoss || 0), 2)}`}
          severity={kpis?.expectancy > 0 ? 'good' : 'bad'}
        />
        <MetricCard
          label="Sharpe"
          value={fmtNum(kpis?.sharpe)}
          subtext="risk-adjusted"
          severity={kpis?.sharpe >= 1 ? 'good' : kpis?.sharpe >= 0.5 ? 'neutral' : 'warn'}
        />
        <MetricCard
          label="Max DD"
          value={fmtPct(kpis?.maxDD)}
          subtext="equity curve"
          severity={kpis?.maxDD < 0.10 ? 'good' : kpis?.maxDD < 0.20 ? 'warn' : 'bad'}
        />
        <MetricCard
          label="Calibration"
          value={fmtNum(kpis?.calibration || kpis?.avgConf)}
          subtext="conf vs outcome"
          severity={Math.abs(kpis?.calibration || 0) > 0.3 ? 'good' : 'neutral'}
        />
      </div>
      
      {/* Diagnostics */}
      <DiagnosticsPanel diagnostics={diagnostics} />
      
      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BreakdownTable
          title="By Horizon"
          data={breakdowns?.horizons || breakdowns?.horizon}
          columns={standardColumns}
        />
        <BreakdownTable
          title="By Tier"
          data={breakdowns?.tiers || breakdowns?.tier}
          columns={standardColumns}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BreakdownTable
          title="By Phase"
          data={breakdowns?.phases || breakdowns?.phase}
          columns={standardColumns}
        />
        <BreakdownTable
          title="By Vol Regime"
          data={breakdowns?.regimes}
          columns={standardColumns}
        />
      </div>
      
      <BreakdownTable
        title="By Divergence Grade"
        data={breakdowns?.divergenceGrades || breakdowns?.divergence}
        columns={standardColumns}
        minSamples={50}
      />

      {/* Info Footer */}
      <div className="text-xs text-gray-400 space-y-1 bg-white rounded-lg border border-gray-200 p-4">
        <p>• <strong>Cohorts:</strong> V1950 (1950-1989), V1990 (1990-2007), V2008 (2008-2019), V2020 (2020-2025), LIVE (2026+)</p>
        <p>• <strong>Attribution</strong> is computed from resolved outcomes with actual returns</p>
        <p>• Run <strong>calibration/backfill</strong> to populate outcomes from historical data</p>
      </div>
    </div>
  );
}
