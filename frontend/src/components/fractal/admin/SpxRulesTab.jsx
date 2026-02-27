/**
 * SPX RULES TAB
 * 
 * BLOCK B6.6 — Rule Extraction UI (Institutional Research Panel)
 * Shows skill scores, winners/losers, broken/edge cells
 */

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function getSkillColor(skill) {
  if (skill >= 0.03) return 'bg-emerald-100 text-emerald-800 border-emerald-400';
  if (skill >= 0.005) return 'bg-green-50 text-green-700 border-green-300';
  if (skill > -0.005) return 'bg-gray-100 text-gray-600 border-gray-300';
  if (skill > -0.03) return 'bg-amber-100 text-amber-700 border-amber-400';
  return 'bg-red-100 text-red-800 border-red-400';
}

function formatSkill(skill) {
  const pct = (skill * 100).toFixed(2);
  return skill >= 0 ? `+${pct}%` : `${pct}%`;
}

function formatPct(val) {
  return `${(val * 100).toFixed(1)}%`;
}

// ═══════════════════════════════════════════════════════════════
// DIAGNOSTICS
// ═══════════════════════════════════════════════════════════════

function DiagnosticsPanel({ data }) {
  if (!data) return null;
  
  return (
    <div className="bg-slate-900 rounded-xl p-6 mb-6" data-testid="spx-rules-diagnostics">
      <h2 className="text-xl font-bold text-white mb-4">B6.6 — SPX Rule Extraction (Skill-First)</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400">Total Outcomes</div>
          <div className="text-xl font-bold text-white">{data.totalOutcomes?.toLocaleString()}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400">Eligible Cells</div>
          <div className="text-xl font-bold text-blue-400">{data.eligibleCells}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400">Min Samples</div>
          <div className="text-xl font-bold text-slate-300">{data.minTotal}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400">Pred UP Share</div>
          <div className={`text-xl font-bold ${data.predUpShare > 0.55 ? 'text-amber-400' : 'text-slate-300'}`}>
            {formatPct(data.predUpShare)}
          </div>
          {data.predUpShare > 0.55 && <div className="text-xs text-amber-500">Bull bias!</div>}
        </div>
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400">Avg Skill Total</div>
          <div className={`text-xl font-bold ${data.avgSkillTotal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatSkill(data.avgSkillTotal)}
          </div>
          {data.avgSkillTotal < 0 && <div className="text-xs text-red-400">Model underperforms!</div>}
        </div>
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400">Metric</div>
          <div className="text-xl font-bold text-purple-400">{data.metric}</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUMMARY TABLES
// ═══════════════════════════════════════════════════════════════

function SummaryTable({ title, items, keyField }) {
  if (!items || items.length === 0) return null;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-bold text-gray-900 mb-3">{title}</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-2">{keyField === 'decade' ? 'Decade' : 'Horizon'}</th>
            <th className="text-right py-2 px-2">Samples</th>
            <th className="text-right py-2 px-2">Avg Skill</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-2 px-2 font-medium">{item[keyField]}</td>
              <td className="py-2 px-2 text-right text-gray-500">{item.samples?.toLocaleString()}</td>
              <td className={`py-2 px-2 text-right font-bold ${item.avgSkill >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatSkill(item.avgSkill)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// RULES CELLS TABLE
// ═══════════════════════════════════════════════════════════════

function RulesCellsTable({ title, cells, variant = 'normal' }) {
  if (!cells || cells.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
        <div className="text-gray-400 text-sm">No cells in this category</div>
      </div>
    );
  }
  
  const borderColor = variant === 'strong' ? 'border-emerald-400' : 
                      variant === 'broken' ? 'border-red-400' : 'border-gray-200';
  
  return (
    <div className={`bg-white rounded-xl border-2 ${borderColor} p-4`}>
      <h3 className="font-bold text-gray-900 mb-3">{title} ({cells.length})</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-1">Decade</th>
              <th className="text-left py-2 px-1">Horizon</th>
              <th className="text-right py-2 px-1">Skill</th>
              <th className="text-right py-2 px-1">Samples</th>
              <th className="text-right py-2 px-1">PredUP%</th>
              <th className="text-right py-2 px-1">HitUP</th>
              <th className="text-right py-2 px-1">BaseUP</th>
              <th className="text-right py-2 px-1">HitDOWN</th>
              <th className="text-right py-2 px-1">BaseDOWN</th>
            </tr>
          </thead>
          <tbody>
            {cells.map((c, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2 px-1 font-medium">{c.decade}</td>
                <td className="py-2 px-1">{c.horizon}</td>
                <td className={`py-2 px-1 text-right font-bold ${c.skillTotal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatSkill(c.skillTotal)}
                </td>
                <td className="py-2 px-1 text-right text-gray-500">{c.total}</td>
                <td className="py-2 px-1 text-right">{formatPct(c.predUpShare)}</td>
                <td className="py-2 px-1 text-right">{formatPct(c.hitUp)}</td>
                <td className="py-2 px-1 text-right text-gray-400">{formatPct(c.baseUpRate)}</td>
                <td className="py-2 px-1 text-right">{formatPct(c.hitDown)}</td>
                <td className="py-2 px-1 text-right text-gray-400">{formatPct(c.baseDownRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EPOCH MATRIX HEATMAP
// ═══════════════════════════════════════════════════════════════

function EpochMatrixHeatmap({ matrix }) {
  if (!matrix || matrix.length === 0) return null;
  
  const decades = [...new Set(matrix.map(c => c.decade))].sort();
  const horizons = ['7d', '14d', '30d', '90d', '180d', '365d'];
  
  const getCellValue = (decade, horizon) => {
    const cell = matrix.find(c => c.decade === decade && c.horizon === horizon);
    return cell?.skillTotal ?? null;
  };
  
  const getCellSamples = (decade, horizon) => {
    const cell = matrix.find(c => c.decade === decade && c.horizon === horizon);
    return cell?.total ?? 0;
  };
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4" data-testid="spx-epoch-matrix">
      <h3 className="font-bold text-gray-900 mb-4">Epoch × Horizon Matrix (Skill Total)</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-2 px-2 font-medium text-gray-600">Decade</th>
              {horizons.map(h => (
                <th key={h} className="text-center py-2 px-2 font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {decades.map(decade => (
              <tr key={decade} className="border-t border-gray-100">
                <td className="py-2 px-2 font-medium text-gray-800">{decade}</td>
                {horizons.map(horizon => {
                  const skill = getCellValue(decade, horizon);
                  const samples = getCellSamples(decade, horizon);
                  
                  if (skill === null) {
                    return (
                      <td key={horizon} className="py-2 px-2 text-center">
                        <div className="bg-gray-100 rounded p-2 text-gray-400 text-xs">—</div>
                      </td>
                    );
                  }
                  
                  return (
                    <td key={horizon} className="py-2 px-2">
                      <div 
                        className={`rounded p-2 text-center border ${getSkillColor(skill)}`}
                        title={`Samples: ${samples}`}
                      >
                        <div className="font-bold text-sm">{formatSkill(skill)}</div>
                        <div className="text-xs opacity-70">{samples.toLocaleString()}</div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs">
        <span className="text-gray-500">Legend:</span>
        <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-400">≥+3% Edge</span>
        <span className="px-2 py-1 rounded bg-green-50 text-green-700 border border-green-300">+0.5% to +3%</span>
        <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 border border-gray-300">Neutral</span>
        <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 border border-amber-400">-0.5% to -3%</span>
        <span className="px-2 py-1 rounded bg-red-100 text-red-800 border border-red-400">≤-3% Broken</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function SpxRulesTab() {
  const [data, setData] = useState(null);
  const [guardrails, setGuardrails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metric, setMetric] = useState('skillTotal');
  
  const fetchRules = useCallback(async (m = metric) => {
    setLoading(true);
    try {
      const [rulesRes, guardrailsRes] = await Promise.all([
        fetch(`${API_BASE}/api/spx/v2.1/admin/rules/extract?metric=${m}`),
        fetch(`${API_BASE}/api/spx/v2.1/guardrails`)
      ]);
      
      const rulesJson = await rulesRes.json();
      const guardrailsJson = await guardrailsRes.json();
      
      if (rulesJson.ok !== false) {
        setData(rulesJson);
        setError(null);
      } else {
        setError(rulesJson.error || 'Failed to fetch rules');
      }
      
      if (guardrailsJson.ok) {
        setGuardrails(guardrailsJson.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [metric]);
  
  useEffect(() => {
    fetchRules();
  }, []);
  
  const handleMetricChange = (m) => {
    setMetric(m);
    fetchRules(m);
  };
  
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spx_rules_${metric}_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  };
  
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading SPX rules...</span>
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
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6" data-testid="spx-rules-tab">
      {/* Diagnostics */}
      <DiagnosticsPanel data={data?.diagnostics} />
      
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-sm">Metric:</span>
          {['skillTotal', 'skillUp', 'skillDown'].map(m => (
            <button
              key={m}
              onClick={() => handleMetricChange(m)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                metric === m
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchRules(metric)}
            className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
          >
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Export JSON
          </button>
        </div>
      </div>
      
      {/* Epoch Matrix */}
      <EpochMatrixHeatmap matrix={data?.matrix} />
      
      {/* Summary Tables */}
      <div className="grid md:grid-cols-2 gap-4">
        <SummaryTable title="By Decade" items={data?.decadeSummary} keyField="decade" />
        <SummaryTable title="By Horizon" items={data?.horizonSummary} keyField="horizon" />
      </div>
      
      {/* Rules */}
      <div className="grid md:grid-cols-2 gap-4">
        <RulesCellsTable 
          title="Strong Edge Cells (≥+3%)" 
          cells={data?.rules?.strongEdgeCells} 
          variant="strong" 
        />
        <RulesCellsTable 
          title="Broken Cells (≤-3%)" 
          cells={data?.rules?.brokenCells} 
          variant="broken" 
        />
      </div>
      
      {/* Weak Edge & Caution */}
      <div className="grid md:grid-cols-2 gap-4">
        <RulesCellsTable 
          title="Weak Edge Cells (+0.5% to +3%)" 
          cells={data?.rules?.weakEdgeCells} 
        />
        <RulesCellsTable 
          title="Caution Cells (±1.5% to ±3%)" 
          cells={data?.rules?.cautionCells} 
        />
      </div>
      
      {/* B6.7 Guardrails Policy */}
      {guardrails && (
        <div className="bg-slate-900 rounded-xl p-6" data-testid="spx-guardrails-policy">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">B6.7 — Guardrails Policy</h3>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs font-bold rounded ${
                guardrails.globalStatus === 'ALLOW' ? 'bg-emerald-500 text-white' :
                guardrails.globalStatus === 'BLOCK' ? 'bg-red-500 text-white' :
                'bg-amber-500 text-white'
              }`}>
                {guardrails.globalStatus}
              </span>
              <span className="text-xs text-slate-400">v{guardrails.version}</span>
              <span className="text-xs text-slate-500 font-mono">{guardrails.policyHash}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-emerald-900/30 rounded-lg p-3 border border-emerald-700">
              <div className="text-xs text-emerald-400 font-medium mb-1">EDGE UNLOCKED</div>
              <div className="text-lg font-bold text-emerald-300">
                {guardrails.allowedHorizons?.length > 0 
                  ? guardrails.allowedHorizons.join(', ') 
                  : 'NONE'}
              </div>
            </div>
            <div className="bg-amber-900/30 rounded-lg p-3 border border-amber-700">
              <div className="text-xs text-amber-400 font-medium mb-1">CAUTION</div>
              <div className="text-lg font-bold text-amber-300">
                {guardrails.cautionHorizons?.join(', ') || '—'}
              </div>
            </div>
            <div className="bg-red-900/30 rounded-lg p-3 border border-red-700">
              <div className="text-xs text-red-400 font-medium mb-1">BLOCKED</div>
              <div className="text-lg font-bold text-red-300">
                {guardrails.blockedHorizons?.length > 0 
                  ? guardrails.blockedHorizons.join(', ') 
                  : 'NONE'}
              </div>
            </div>
          </div>
          
          {/* Horizon Decisions */}
          <div className="space-y-2">
            <div className="text-xs text-slate-400 font-medium">Per-Horizon Decisions:</div>
            <div className="grid grid-cols-6 gap-2">
              {guardrails.decisions?.map(d => (
                <div 
                  key={d.horizon}
                  className={`rounded-lg p-3 text-center border ${
                    d.status === 'ALLOW' ? 'bg-emerald-900/30 border-emerald-600' :
                    d.status === 'BLOCK' ? 'bg-red-900/30 border-red-600' :
                    'bg-amber-900/30 border-amber-600'
                  }`}
                >
                  <div className={`text-lg font-bold ${
                    d.status === 'ALLOW' ? 'text-emerald-400' :
                    d.status === 'BLOCK' ? 'text-red-400' :
                    'text-amber-400'
                  }`}>
                    {d.horizon}
                  </div>
                  <div className={`text-xs font-medium ${
                    d.status === 'ALLOW' ? 'text-emerald-500' :
                    d.status === 'BLOCK' ? 'text-red-500' :
                    'text-amber-500'
                  }`}>
                    {d.status}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    skill: {(d.evidence?.skill * 100).toFixed(1)}%
                  </div>
                  {d.reasons?.length > 0 && (
                    <div className="text-[10px] text-slate-600 mt-1">
                      {d.reasons[0]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-700 text-xs text-slate-500">
            <span className="text-slate-400">Rules Mode:</span> ON | 
            <span className="text-slate-400 ml-2">Policy:</span> Constitutional v1 (90d only confirmed edge)
          </div>
        </div>
      )}
      
      {/* Key Insight */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h4 className="font-bold text-amber-800 mb-2">Key Insight</h4>
        <div className="text-sm text-amber-700 space-y-1">
          <p>• <strong>Skill = Model HitRate - Baseline Rate</strong> (not raw hitRate!)</p>
          <p>• Positive skill means model outperforms random guessing</p>
          <p>• Negative skill means model is <strong>worse than baseline</strong> (harmful)</p>
          <p>• Bull bias ({formatPct(data?.diagnostics?.predUpShare || 0)} UP predictions) inflates naive hitRate</p>
        </div>
      </div>
    </div>
  );
}

export default SpxRulesTab;
