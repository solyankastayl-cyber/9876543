/**
 * BLOCK 75.UI.1 — Attribution Tab (Institutional Grade)
 * BLOCK 77.4 — DATA SOURCE Toggle (LIVE / BOOTSTRAP / ALL)
 * 
 * Single API call → entire tab
 * Shows: Headline KPIs, Tier Scoreboard, Regime Attribution,
 *        Divergence Impact, Phase Quality, Auto Insights
 * 
 * BLOCK 77.4 Features:
 * - DATA SOURCE toggle: LIVE / BOOTSTRAP / ALL
 * - Badge when viewing BOOTSTRAP (historical simulation) data
 * - Stats bar showing breakdown by source
 * - API requests include source parameter
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const WINDOWS = ['30d', '90d', '180d', '365d'];
const PRESETS = ['conservative', 'balanced', 'aggressive'];
const ROLES = ['ACTIVE', 'SHADOW'];
const SOURCES = ['ALL', 'LIVE', 'BOOTSTRAP'];

// ═══════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════

function GradeBadge({ grade, capped }) {
  const colors = {
    'A': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'B': 'bg-blue-100 text-blue-800 border-blue-300',
    'C': 'bg-amber-100 text-amber-800 border-amber-300',
    'D': 'bg-orange-100 text-orange-800 border-orange-300',
    'F': 'bg-red-100 text-red-800 border-red-300'
  };
  
  return (
    <span className={`px-2 py-0.5 text-xs font-bold rounded border ${colors[grade] || colors['C']}`}>
      {grade}{capped ? '*' : ''}
    </span>
  );
}

function MetricCard({ label, value, subtext, severity }) {
  const bgColor = {
    'good': 'bg-emerald-50 border-emerald-200',
    'warn': 'bg-amber-50 border-amber-200',
    'bad': 'bg-red-50 border-red-200',
    'neutral': 'bg-gray-50 border-gray-200'
  }[severity || 'neutral'];
  
  return (
    <div className={`p-4 rounded-lg border ${bgColor}`}>
      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {subtext && <div className="text-xs text-gray-400 mt-1">{subtext}</div>}
    </div>
  );
}

function InsightItem({ insight }) {
  const colors = {
    'INFO': 'border-blue-300 bg-blue-50',
    'WARN': 'border-amber-300 bg-amber-50',
    'CRITICAL': 'border-red-300 bg-red-50'
  };
  
  const icons = {
    'INFO': '💡',
    'WARN': '⚠️',
    'CRITICAL': '🚨'
  };
  
  return (
    <div className={`p-3 rounded-lg border ${colors[insight.severity] || colors['INFO']}`}>
      <div className="flex items-start gap-2">
        <span className="text-lg">{icons[insight.severity]}</span>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900">{insight.message}</div>
          <div className="text-xs text-gray-500 mt-1">{insight.evidence}</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BLOCK 77.4 — DATA SOURCE BADGE
// ═══════════════════════════════════════════════════════════════

function SourceModeBadge({ source, liveCount, bootstrapCount }) {
  if (source === 'ALL' || source === 'LIVE') return null;
  
  return (
    <div className="bg-amber-100 border border-amber-400 rounded-lg px-4 py-3 flex items-center gap-3" data-testid="source-mode-badge">
      <span className="text-amber-600 text-xl">⏳</span>
      <div>
        <div className="font-semibold text-amber-800">HISTORICAL SIMULATION MODE</div>
        <div className="text-sm text-amber-600">
          Viewing bootstrap data only ({bootstrapCount} outcomes) • Not live production data
        </div>
      </div>
    </div>
  );
}

function SourceStatsBar({ source, liveCount, bootstrapCount, total }) {
  if (source === 'ALL' && liveCount > 0 && bootstrapCount > 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center gap-3" data-testid="source-stats-bar">
        <span className="text-blue-500 text-lg">📊</span>
        <div className="text-sm text-blue-700">
          <span className="font-medium">LIVE + HISTORICAL COMPARISON</span>
          <span className="mx-2">•</span>
          <span className="text-green-600">Live: {liveCount}</span>
          <span className="mx-2">|</span>
          <span className="text-amber-600">Bootstrap: {bootstrapCount}</span>
          <span className="mx-2">|</span>
          <span>Total: {total}</span>
        </div>
      </div>
    );
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function AttributionTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const window = searchParams.get('window') || '90d';
  const preset = searchParams.get('preset') || 'balanced';
  const role = searchParams.get('role') || 'ACTIVE';
  const source = searchParams.get('source') || 'ALL';
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const updateParams = (key, value) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'attribution');
    params.set(key, value);
    setSearchParams(params, { replace: true });
  };
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const url = `${API_BASE}/api/fractal/v2.1/admin/attribution?symbol=BTC&window=${window}&preset=${preset}&role=${role}&source=${source}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch attribution data');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [window, preset, role, source]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading attribution data...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center p-6 bg-red-50 rounded-xl border border-red-200 max-w-md">
          <p className="text-red-600 font-medium mb-2">Error loading attribution</p>
          <p className="text-red-500 text-sm">{error}</p>
          <button 
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  const { meta, headline, tiers, regimes, divergence, phases, insights, guardrails } = data || {};
  
  const fmtPct = (v) => v != null ? `${(v * 100).toFixed(1)}%` : '—';
  const fmtNum = (v, d = 1) => v != null ? v.toFixed(d) : '—';
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6" data-testid="attribution-tab">
      {/* BLOCK 77.4 — DATA SOURCE Toggle */}
      <div className="bg-slate-900 rounded-lg border border-slate-700 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Data Source:</span>
            <div className="flex gap-1 bg-slate-800 rounded-lg p-1" data-testid="source-toggle">
              {SOURCES.map(s => (
                <button
                  key={s}
                  onClick={() => updateParams('source', s)}
                  data-testid={`source-btn-${s.toLowerCase()}`}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    source === s 
                      ? s === 'LIVE' 
                        ? 'bg-green-600 text-white shadow-lg' 
                        : s === 'BOOTSTRAP'
                          ? 'bg-amber-600 text-white shadow-lg'
                          : 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {s === 'ALL' ? '📊 ALL' : s === 'LIVE' ? '🟢 LIVE' : '⏳ BOOTSTRAP'}
                </button>
              ))}
            </div>
          </div>
          <div className="text-xs text-slate-500">
            {source === 'LIVE' && 'Only real-time live production outcomes'}
            {source === 'BOOTSTRAP' && 'Only historical simulation data'}
            {source === 'ALL' && 'Combined live + historical data'}
          </div>
        </div>
      </div>

      {/* BLOCK 77.4 — Source Mode Badge */}
      <SourceModeBadge 
        source={source} 
        liveCount={meta?.liveCount || 0} 
        bootstrapCount={meta?.bootstrapCount || 0} 
      />
      
      {/* BLOCK 77.4 — Source Stats Bar (for ALL mode) */}
      <SourceStatsBar 
        source={source}
        liveCount={meta?.liveCount || 0}
        bootstrapCount={meta?.bootstrapCount || 0}
        total={meta?.resolvedCount || 0}
      />

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Window:</span>
            <div className="flex gap-1">
              {WINDOWS.map(w => (
                <button
                  key={w}
                  onClick={() => updateParams('window', w)}
                  data-testid={`window-btn-${w}`}
                  className={`px-3 py-1 text-sm rounded ${
                    window === w 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Preset:</span>
            <select
              value={preset}
              onChange={(e) => updateParams('preset', e.target.value)}
              data-testid="preset-select"
              className="px-3 py-1 text-sm border border-gray-300 rounded"
            >
              {PRESETS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Role:</span>
            <select
              value={role}
              onChange={(e) => updateParams('role', e.target.value)}
              data-testid="role-select"
              className="px-3 py-1 text-sm border border-gray-300 rounded"
            >
              {ROLES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          
          <div className="ml-auto text-sm text-gray-400" data-testid="meta-info">
            N = {meta?.resolvedCount || 0} resolved • as of {meta?.asof || '—'}
            {meta?.liveCount > 0 && <span className="ml-2 text-green-500">({meta.liveCount} live)</span>}
            {meta?.bootstrapCount > 0 && <span className="ml-1 text-amber-500">({meta.bootstrapCount} bootstrap)</span>}
          </div>
        </div>
      </div>
      
      {/* Guardrails Warning */}
      {guardrails?.insufficientData && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <div>
              <div className="font-medium text-amber-800">Insufficient Data</div>
              <div className="text-sm text-amber-600">
                {guardrails.reasons?.join('. ') || 'Need more resolved outcomes for reliable metrics.'}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Headline KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          label="Hit Rate"
          value={fmtPct(headline?.hitRate)}
          subtext={headline?.hitRateCI ? `CI: ${fmtPct(headline.hitRateCI[0])}–${fmtPct(headline.hitRateCI[1])}` : null}
          severity={headline?.hitRate >= 0.55 ? 'good' : headline?.hitRate >= 0.45 ? 'neutral' : 'bad'}
        />
        <MetricCard
          label="Expectancy"
          value={`${fmtNum(headline?.expectancy)}%`}
          severity={headline?.expectancy > 0 ? 'good' : headline?.expectancy < -2 ? 'bad' : 'neutral'}
        />
        <MetricCard
          label="Sharpe"
          value={headline?.sharpe != null ? fmtNum(headline.sharpe, 2) : 'N/A'}
          subtext={headline?.sharpe == null ? 'Need more samples' : null}
          severity={headline?.sharpe >= 1 ? 'good' : headline?.sharpe >= 0.5 ? 'neutral' : 'warn'}
        />
        <MetricCard
          label="Max DD"
          value={`${fmtNum(headline?.maxDD)}%`}
          severity={headline?.maxDD < 10 ? 'good' : headline?.maxDD < 20 ? 'warn' : 'bad'}
        />
        <MetricCard
          label="Calibration"
          value={`${fmtNum(headline?.calibrationError)}%`}
          subtext="Expected vs Realized"
          severity={headline?.calibrationError < 2 ? 'good' : headline?.calibrationError < 5 ? 'warn' : 'bad'}
        />
        <MetricCard
          label="Avg Divergence"
          value={fmtNum(headline?.avgDivergenceScore)}
          severity="neutral"
        />
      </div>
      
      {/* Tier Scoreboard */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Tier Attribution</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">N</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Hit Rate</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Expectancy</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Sharpe</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">MaxDD</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tiers?.map(tier => (
                <tr key={tier.tier} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{tier.tier}</span>
                    {tier.notes?.length > 0 && (
                      <span className="ml-2 text-xs text-amber-600">⚠️</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">{tier.samples}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium">{fmtPct(tier.hitRate)}</td>
                  <td className="px-4 py-3 text-right text-sm">{fmtNum(tier.expectancy)}%</td>
                  <td className="px-4 py-3 text-right text-sm">{tier.sharpe != null ? fmtNum(tier.sharpe, 2) : '—'}</td>
                  <td className="px-4 py-3 text-right text-sm">{fmtNum(tier.maxDD)}%</td>
                  <td className="px-4 py-3 text-center">
                    <GradeBadge grade={tier.grade} capped={tier.gradeCapped} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regime Attribution */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Regime Attribution</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Regime</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">N</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Hit</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Exp</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {regimes?.slice(0, 6).map(r => (
                  <tr key={r.regime} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-900">{r.regime}</td>
                    <td className="px-4 py-2 text-right text-sm text-gray-600">{r.samples}</td>
                    <td className="px-4 py-2 text-right text-sm">{fmtPct(r.hitRate)}</td>
                    <td className="px-4 py-2 text-right text-sm">{fmtNum(r.expectancy)}%</td>
                    <td className="px-4 py-2 text-center"><GradeBadge grade={r.grade} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Divergence Impact */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Divergence Impact</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">N</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Hit</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Exp</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Avg Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {divergence?.map(d => (
                  <tr key={d.grade} className={`hover:bg-gray-50 ${d.grade === 'D' || d.grade === 'F' ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-2"><GradeBadge grade={d.grade} /></td>
                    <td className="px-4 py-2 text-right text-sm text-gray-600">{d.samples}</td>
                    <td className="px-4 py-2 text-right text-sm">{fmtPct(d.hitRate)}</td>
                    <td className="px-4 py-2 text-right text-sm">{fmtNum(d.expectancy)}%</td>
                    <td className="px-4 py-2 text-right text-sm">{fmtNum(d.avgScore)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Phase Quality */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Phase Attribution</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phase</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">N</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Hit Rate</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Expectancy</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Size Mult</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {phases?.slice(0, 8).map(p => (
                <tr key={p.phaseType} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">{p.phaseType}</td>
                  <td className="px-4 py-2 text-right text-sm text-gray-600">{p.samples}</td>
                  <td className="px-4 py-2 text-right text-sm">{fmtPct(p.hitRate)}</td>
                  <td className="px-4 py-2 text-right text-sm">{fmtNum(p.expectancy)}%</td>
                  <td className="px-4 py-2 text-right text-sm">×{fmtNum(p.sizeMult, 2)}</td>
                  <td className="px-4 py-2 text-center"><GradeBadge grade={p.grade} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Auto Insights */}
      {insights?.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Auto Insights</h3>
          </div>
          <div className="p-4 space-y-3">
            {insights.map((insight, i) => (
              <InsightItem key={i} insight={insight} />
            ))}
          </div>
        </div>
      )}
      
      {/* Guardrails Status */}
      {guardrails?.capsApplied?.length > 0 && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">
            <span className="font-medium">Guardrails applied: </span>
            {guardrails.capsApplied.join(', ')}
          </div>
        </div>
      )}
    </div>
  );
}

export default AttributionTab;
