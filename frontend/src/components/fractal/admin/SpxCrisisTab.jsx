/**
 * SPX CRISIS TAB
 * 
 * BLOCK B6.10.3 — Crisis Validation & Stability Report UI
 * 
 * Shows epoch-level skill matrix with stability scores and verdicts.
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// Helpers
function pct(x) {
  if (typeof x !== 'number' || isNaN(x)) return '—';
  return `${(x * 100).toFixed(2)}%`;
}

function skill(x) {
  if (typeof x !== 'number' || isNaN(x)) return '—';
  const v = (x * 100).toFixed(2);
  return `${x >= 0 ? '+' : ''}${v}%`;
}

// Verdict badge component
function VerdictBadge({ verdict }) {
  const colors = {
    STRONG: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    MIXED: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    FRAGILE: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${colors[verdict] || colors.MIXED}`}>
      {verdict}
    </span>
  );
}

// Global verdict badge
function GlobalVerdictBadge({ verdict }) {
  const configs = {
    EDGE_CONFIRMED: { label: 'EDGE CONFIRMED', color: 'bg-emerald-500 text-white' },
    EDGE_MIXED: { label: 'EDGE MIXED', color: 'bg-amber-500 text-white' },
    EDGE_FRAGILE: { label: 'EDGE FRAGILE', color: 'bg-red-500 text-white' },
    NO_DATA: { label: 'NO DATA', color: 'bg-slate-500 text-white' },
  };
  
  const config = configs[verdict] || configs.NO_DATA;
  
  return (
    <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${config.color}`}>
      {config.label}
    </span>
  );
}

// Epoch Card Component
function EpochCard({ summary }) {
  const borderColors = {
    STRONG: 'border-emerald-500/30',
    MIXED: 'border-amber-500/30',
    FRAGILE: 'border-red-500/30',
  };
  
  return (
    <div 
      className={`bg-slate-800 rounded-xl p-4 border ${borderColors[summary.verdict] || 'border-slate-700'}`}
      data-testid={`crisis-epoch-${summary.epoch}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-bold text-white">{summary.epoch}</div>
          <div className="text-xs text-slate-400">{summary.label}</div>
        </div>
        <VerdictBadge verdict={summary.verdict} />
      </div>
      
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs text-slate-400">Stability Score</span>
        <span className={`text-2xl font-black ${
          summary.stabilityScore >= 70 ? 'text-emerald-400' :
          summary.stabilityScore <= 35 ? 'text-red-400' : 'text-amber-400'
        }`}>
          {summary.stabilityScore}%
        </span>
      </div>
      
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-slate-400">Edge Survived?</span>
        <span className={summary.edgeSurvived ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
          {summary.edgeSurvived ? 'YES' : 'NO'}
        </span>
      </div>
      
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-slate-400">Samples</span>
        <span className="text-slate-300 font-medium">{summary.totalSamples || 0}</span>
      </div>
      
      {summary.worst && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <div className="text-xs text-slate-500 mb-1">Worst Cell</div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">{summary.worst.horizon}</span>
            <span className={`text-sm font-bold ${summary.worst.skillTotal < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {skill(summary.worst.skillTotal)}
            </span>
          </div>
        </div>
      )}
      
      {summary.best && summary.best.horizon !== summary.worst?.horizon && (
        <div className="mt-2">
          <div className="text-xs text-slate-500 mb-1">Best Cell</div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">{summary.best.horizon}</span>
            <span className={`text-sm font-bold ${summary.best.skillTotal < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {skill(summary.best.skillTotal)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Matrix Table Component
function EpochMatrixTable({ epochCode, rows }) {
  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const order = ['7d', '14d', '30d', '90d', '180d', '365d'];
      return order.indexOf(a.horizon) - order.indexOf(b.horizon);
    });
  }, [rows]);
  
  return (
    <div className="mb-6">
      <div className="font-bold text-white mb-3">{epochCode}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-400 border-b border-slate-700">
              <th className="text-left py-2 px-2">Horizon</th>
              <th className="text-right py-2 px-2">Samples</th>
              <th className="text-right py-2 px-2">Base UP</th>
              <th className="text-right py-2 px-2">Base DOWN</th>
              <th className="text-right py-2 px-2">Hit Total</th>
              <th className="text-right py-2 px-2 font-bold">Skill Total</th>
              <th className="text-right py-2 px-2">Skill UP</th>
              <th className="text-right py-2 px-2">Skill DOWN</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((r, idx) => {
              const isNegative = r.skillTotal < 0;
              const isPositive = r.skillTotal > 0.01;
              return (
                <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="py-2 px-2 font-bold text-slate-200">{r.horizon}</td>
                  <td className="py-2 px-2 text-right text-slate-400">{r.samples}</td>
                  <td className="py-2 px-2 text-right text-slate-400">{pct(r.baseUpRate)}</td>
                  <td className="py-2 px-2 text-right text-slate-400">{pct(r.baseDownRate)}</td>
                  <td className="py-2 px-2 text-right text-slate-300">{pct(r.hitTotal)}</td>
                  <td className={`py-2 px-2 text-right font-black ${
                    isNegative ? 'text-red-400' : isPositive ? 'text-emerald-400' : 'text-slate-300'
                  }`}>
                    {skill(r.skillTotal)}
                  </td>
                  <td className={`py-2 px-2 text-right ${r.skillUp < 0 ? 'text-red-400' : 'text-slate-300'}`}>
                    {skill(r.skillUp)}
                  </td>
                  <td className={`py-2 px-2 text-right ${r.skillDown < 0 ? 'text-red-400' : 'text-slate-300'}`}>
                    {skill(r.skillDown)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Main Component
export function SpxCrisisTab() {
  const [data, setData] = useState(null);
  const [guardrails, setGuardrails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preset, setPreset] = useState('BALANCED');
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [matrixRes, guardrailsRes] = await Promise.all([
        fetch(`${API_BASE}/api/spx/v2.1/admin/crisis/matrix?preset=${preset}`),
        fetch(`${API_BASE}/api/spx/v2.1/admin/crisis/guardrails?preset=${preset}`),
      ]);
      
      const matrixJson = await matrixRes.json();
      const guardrailsJson = await guardrailsRes.json();
      
      if (matrixJson.ok) {
        setData(matrixJson.data);
      } else {
        setError(matrixJson.error || 'Failed to fetch crisis matrix');
      }
      
      if (guardrailsJson.ok) {
        setGuardrails(guardrailsJson.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [preset]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const rowsByEpoch = useMemo(() => {
    if (!data?.rows) return new Map();
    const map = new Map();
    for (const r of data.rows) {
      const arr = map.get(r.epoch) ?? [];
      arr.push(r);
      map.set(r.epoch, arr);
    }
    return map;
  }, [data?.rows]);
  
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-64 mb-4"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-48 bg-slate-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="font-bold text-red-400 mb-2">Error Loading Crisis Data</div>
          <div className="text-sm text-slate-300">{error}</div>
          <button 
            onClick={fetchData}
            className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6" data-testid="spx-crisis-tab">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">B6.10 — Crisis Validation Report</h2>
          <p className="text-sm text-slate-400 mt-1">
            Skill = HitRate − Baseline (market drift). Validates edge across crisis epochs.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
          >
            <option value="BALANCED">BALANCED</option>
            <option value="DEFENSIVE">DEFENSIVE</option>
            <option value="AGGRESSIVE">AGGRESSIVE</option>
          </select>
          {data?.globalVerdict && (
            <GlobalVerdictBadge verdict={data.globalVerdict} />
          )}
        </div>
      </div>
      
      {/* Recommendations */}
      {data?.recommendations?.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="font-bold text-white mb-2">Policy Recommendations</div>
          <ul className="space-y-1">
            {data.recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                <span className="text-amber-400">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Epoch Cards Grid */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Epoch Summaries</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data?.epochSummary?.map(summary => (
            <EpochCard key={summary.epoch} summary={summary} />
          ))}
        </div>
      </div>
      
      {/* Crisis Guardrails Summary */}
      {guardrails && (
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-bold text-white">Crisis-Aware Guardrails Policy</div>
              <div className="text-xs text-slate-400">Version {guardrails.version}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-400">{guardrails.summary?.allowedCells || 0}</div>
                <div className="text-xs text-slate-500">ALLOW</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-amber-400">{guardrails.summary?.cautionCells || 0}</div>
                <div className="text-xs text-slate-500">CAUTION</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-400">{guardrails.summary?.blockedCells || 0}</div>
                <div className="text-xs text-slate-500">BLOCK</div>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-slate-500">
            Thresholds: Block skill ≤ {(guardrails.thresholds?.blockSkillTotal * 100).toFixed(1)}% | 
            Caution skill ≤ {(guardrails.thresholds?.cautionSkillTotal * 100).toFixed(1)}% | 
            Min samples: {guardrails.thresholds?.minSamples}
          </div>
        </div>
      )}
      
      {/* Full Matrix */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-4">Epoch × Horizon Skill Matrix</h3>
        {[...rowsByEpoch.entries()].map(([epoch, rows]) => (
          <EpochMatrixTable key={epoch} epochCode={epoch} rows={rows} />
        ))}
      </div>
      
      {/* Meta */}
      <div className="text-xs text-slate-500 text-center">
        Computed: {data?.computedAt ? new Date(data.computedAt).toLocaleString() : '—'} | 
        Total Epochs: {data?.totalEpochs || 0} | 
        Total Cells: {data?.totalCells || 0}
      </div>
    </div>
  );
}

export default SpxCrisisTab;
