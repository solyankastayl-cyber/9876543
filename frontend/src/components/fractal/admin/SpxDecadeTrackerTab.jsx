/**
 * SPX DECADE TRACKER TAB
 * 
 * BLOCK B6.10.2 — Live Decade Aggregator with Mini Heatmap
 * 
 * Shows how model evolves across decades (1950s, 1960s, ... 2020s)
 * with skill tracking and confidence levels.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// Skill color helper
function getSkillColor(skill, hasData = true) {
  if (!hasData) return 'bg-slate-700 text-slate-500';
  if (skill > 0.02) return 'bg-emerald-500/30 text-emerald-400';
  if (skill > 0) return 'bg-emerald-500/10 text-emerald-300';
  if (skill > -0.02) return 'bg-amber-500/20 text-amber-400';
  return 'bg-red-500/30 text-red-400';
}

function getSkillTextColor(skill) {
  if (skill > 0.02) return 'text-emerald-400';
  if (skill > 0) return 'text-emerald-300';
  if (skill > -0.02) return 'text-amber-400';
  return 'text-red-400';
}

function formatSkill(skill) {
  if (typeof skill !== 'number' || isNaN(skill)) return '—';
  return `${skill >= 0 ? '+' : ''}${(skill * 100).toFixed(1)}%`;
}

function formatPct(val) {
  if (typeof val !== 'number' || isNaN(val)) return '—';
  return `${(val * 100).toFixed(1)}%`;
}

// B6.10.2.1: Vol Regime Badge
function VolRegimeBadge({ regime }) {
  const configs = {
    LOW: { label: 'LOW VOL', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    MEDIUM: { label: 'MED VOL', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    HIGH: { label: 'HIGH VOL', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    EXTREME: { label: 'EXTREME', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  };
  const config = configs[regime] || configs.MEDIUM;
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${config.color}`}>
      {config.label}
    </span>
  );
}

// Model State Badge
function ModelStateBadge({ state }) {
  const configs = {
    EDGE_POSITIVE: { label: 'EDGE POSITIVE', color: 'bg-emerald-500 text-white' },
    EDGE_NEUTRAL: { label: 'EDGE NEUTRAL', color: 'bg-amber-500 text-white' },
    EDGE_FRAGILE: { label: 'EDGE FRAGILE', color: 'bg-red-500 text-white' },
  };
  const config = configs[state] || configs.EDGE_NEUTRAL;
  return (
    <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${config.color}`}>
      {config.label}
    </span>
  );
}

// Confidence Badge
function ConfidenceBadge({ confidence }) {
  const colors = {
    HIGH: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    LOW: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${colors[confidence] || colors.LOW}`}>
      {confidence}
    </span>
  );
}

// KPI Card
function KPICard({ label, value, subtext, highlight = false }) {
  return (
    <div className={`rounded-xl p-4 ${highlight ? 'bg-slate-700' : 'bg-slate-800'} border border-slate-700`}>
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className={`text-2xl font-black ${highlight ? 'text-white' : 'text-slate-200'}`}>{value}</div>
      {subtext && <div className="text-xs text-slate-500 mt-1">{subtext}</div>}
    </div>
  );
}

// Mini Heatmap Component
function MiniHeatmap({ heatmap }) {
  const { decades = [], horizons = [], cells = [] } = heatmap || {};
  
  // Create lookup
  const cellMap = useMemo(() => {
    const map = new Map();
    for (const c of cells) {
      map.set(`${c.decade}-${c.horizon}`, c);
    }
    return map;
  }, [cells]);
  
  if (decades.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl p-4 text-center text-slate-400">
        No data available for heatmap
      </div>
    );
  }
  
  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 overflow-x-auto">
      <div className="font-bold text-white mb-4">Decade × Horizon Skill Heatmap</div>
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left py-2 px-2 text-slate-400 font-medium">Decade</th>
            {horizons.map(h => (
              <th key={h} className="text-center py-2 px-2 text-slate-400 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {decades.map(decade => (
            <tr key={decade} className="border-t border-slate-700/50">
              <td className="py-2 px-2 font-bold text-slate-200">{decade}</td>
              {horizons.map(h => {
                const cell = cellMap.get(`${decade}-${h}`);
                const skill = cell?.skill ?? 0;
                const samples = cell?.samples ?? 0;
                const hasData = samples > 0;
                return (
                  <td 
                    key={h} 
                    className={`py-2 px-2 text-center ${getSkillColor(skill, hasData)}`}
                    title={`${decade} ${h}: skill=${formatSkill(skill)}, samples=${samples}`}
                  >
                    {hasData ? formatSkill(skill) : '—'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-slate-700 flex items-center gap-4 text-xs">
        <span className="text-slate-500">Legend:</span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-emerald-500/30"></span>
          <span className="text-slate-400">&gt;+2%</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-emerald-500/10"></span>
          <span className="text-slate-400">0 to +2%</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-amber-500/20"></span>
          <span className="text-slate-400">-2% to 0</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-red-500/30"></span>
          <span className="text-slate-400">&lt;-2%</span>
        </span>
      </div>
    </div>
  );
}

// Decade Row Component with B6.10.2.1 Volatility Overlay
function DecadeRow({ decade }) {
  const [expanded, setExpanded] = useState(false);
  const vol = decade.volatility;
  
  return (
    <>
      <tr 
        className="border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="py-3 px-3 font-bold text-slate-200">{decade.decade}</td>
        <td className="py-3 px-3 text-right text-slate-300">{decade.samples.toLocaleString()}</td>
        <td className="py-3 px-3 text-right">
          <ConfidenceBadge confidence={decade.confidence} />
        </td>
        <td className="py-3 px-3 text-right text-slate-300">{formatPct(decade.hitRate)}</td>
        <td className="py-3 px-3 text-right text-slate-400">{formatPct(decade.baselineUp)}</td>
        <td className={`py-3 px-3 text-right font-bold ${getSkillTextColor(decade.skillTotal)}`}>
          {formatSkill(decade.skillTotal)}
        </td>
        <td className={`py-3 px-3 text-right ${getSkillTextColor(decade.skillUp)}`}>
          {formatSkill(decade.skillUp)}
        </td>
        <td className={`py-3 px-3 text-right ${getSkillTextColor(decade.skillDown)}`}>
          {formatSkill(decade.skillDown)}
        </td>
        {/* B6.10.2.1: Vol Regime */}
        <td className="py-3 px-3 text-center">
          {vol ? <VolRegimeBadge regime={vol.volRegime} /> : <span className="text-slate-500">—</span>}
        </td>
        <td className="py-3 px-3 text-center text-slate-500">
          {expanded ? '▼' : '▶'}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-900/50">
          <td colSpan={10} className="px-3 py-3">
            {/* B6.10.2.1: Volatility Overlay Section */}
            {vol && (
              <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="text-xs text-slate-400 mb-2 font-medium">B6.10.2.1 — Volatility Overlay</div>
                <div className="grid grid-cols-4 gap-4 text-xs">
                  <div>
                    <div className="text-slate-500">Realized Vol (ann.)</div>
                    <div className={`font-bold ${vol.realizedVol > 0.2 ? 'text-amber-400' : 'text-slate-200'}`}>
                      {formatPct(vol.realizedVol)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Avg Max DD</div>
                    <div className="font-bold text-red-400">-{formatPct(vol.avgMaxDD)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Avg Trend Duration</div>
                    <div className="font-bold text-slate-200">{vol.avgTrendDuration?.toFixed(1)} days</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Vol Regime</div>
                    <VolRegimeBadge regime={vol.volRegime} />
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-xs text-slate-400 mb-2">By Horizon:</div>
            <div className="grid grid-cols-6 gap-2">
              {decade.byHorizon?.map(h => (
                <div 
                  key={h.horizon} 
                  className={`rounded-lg p-2 text-center ${getSkillColor(h.skill, h.samples > 0)}`}
                >
                  <div className="font-bold text-sm">{h.horizon}</div>
                  <div className="text-xs opacity-80">{formatSkill(h.skill)}</div>
                  <div className="text-[10px] opacity-60">{h.samples} samples</div>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// Main Component
export function SpxDecadeTrackerTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preset, setPreset] = useState('BALANCED');
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/spx/v2.1/admin/calibration/decade-tracker?preset=${preset}`);
      const json = await res.json();
      if (json.ok) {
        setData(json.data);
        setError(null);
      } else {
        setError(json.error || 'Failed to fetch decade tracker');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [preset]);
  
  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);
  
  // Auto refresh every 10 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);
  
  if (loading && !data) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-700 rounded w-64"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-700 rounded-xl"></div>)}
          </div>
          <div className="h-64 bg-slate-700 rounded-xl"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="font-bold text-red-400 mb-2">Error</div>
          <div className="text-sm text-slate-300">{error}</div>
          <button onClick={fetchData} className="mt-3 px-4 py-2 bg-red-500/20 rounded-lg text-red-400 text-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  const { decades = [], global = {}, heatmap } = data || {};
  
  return (
    <div className="p-6 space-y-6" data-testid="spx-decade-tracker-tab">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">B6.10.2 — Decade Live Tracker</h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time skill evolution across 75 years of market history
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input 
              type="checkbox" 
              checked={autoRefresh} 
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
          >
            <option value="BALANCED">BALANCED</option>
            <option value="DEFENSIVE">DEFENSIVE</option>
            <option value="AGGRESSIVE">AGGRESSIVE</option>
          </select>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 text-sm font-medium"
          >
            Refresh
          </button>
          {global.modelState && <ModelStateBadge state={global.modelState} />}
        </div>
      </div>
      
      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-4">
        <KPICard 
          label="Total Samples" 
          value={global.totalSamples?.toLocaleString() || '0'} 
          subtext={`${decades.length} decade(s)`}
        />
        <KPICard 
          label="Average Skill" 
          value={formatSkill(global.avgSkill)} 
          highlight={global.avgSkill > 0}
        />
        <KPICard 
          label="Best Decade" 
          value={global.bestDecade || '—'} 
          subtext={global.bestDecade ? `Highest skill` : 'Need more data'}
        />
        <KPICard 
          label="Worst Decade" 
          value={global.worstDecade || '—'} 
          subtext={global.worstDecade ? `Lowest skill` : 'Need more data'}
        />
        {/* B6.10.2.1: Vol-Skill Correlation */}
        <KPICard 
          label="Vol↔Skill Corr" 
          value={global.volSkillCorrelation != null ? global.volSkillCorrelation.toFixed(2) : '—'} 
          subtext={global.volSkillCorrelation != null 
            ? (global.volSkillCorrelation > 0.3 ? 'Positive link' : global.volSkillCorrelation < -0.3 ? 'Inverse link' : 'Weak link')
            : 'Need 2+ decades'
          }
          highlight={global.volSkillCorrelation > 0.3}
        />
      </div>
      
      {/* Mini Heatmap */}
      <MiniHeatmap heatmap={heatmap} />
      
      {/* Decade Table */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 overflow-x-auto">
        <div className="font-bold text-white mb-4">Decade Details</div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-400 border-b border-slate-700">
              <th className="text-left py-2 px-3">Decade</th>
              <th className="text-right py-2 px-3">Samples</th>
              <th className="text-right py-2 px-3">Confidence</th>
              <th className="text-right py-2 px-3">Hit Rate</th>
              <th className="text-right py-2 px-3">Baseline UP</th>
              <th className="text-right py-2 px-3 font-bold">Skill Total</th>
              <th className="text-right py-2 px-3">Skill UP</th>
              <th className="text-right py-2 px-3">Skill DOWN</th>
              <th className="text-center py-2 px-3">Vol Regime</th>
              <th className="text-center py-2 px-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {decades.map(decade => (
              <DecadeRow key={decade.decade} decade={decade} />
            ))}
          </tbody>
        </table>
        
        {decades.length === 0 && (
          <div className="text-center text-slate-500 py-8">
            No decade data yet. Run calibration to populate.
          </div>
        )}
      </div>
      
      {/* Meta */}
      <div className="text-xs text-slate-500 text-center">
        Computed: {data?.computedAt ? new Date(data.computedAt).toLocaleString() : '—'}
        {autoRefresh && ' • Auto-refreshing every 10s'}
      </div>
    </div>
  );
}

export default SpxDecadeTrackerTab;
