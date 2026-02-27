/**
 * Engine Dashboard v1.05
 * 
 * Quality Control Dashboard - НЕ trading UI
 * 
 * v1.05 Улучшения:
 * 1. Engine Health Banner → DATA COLLECTION status (info, не warning)
 * 2. Evidence vs Risk → Decision Gate Overlay
 * 3. Stability → Tooltip для median lifespan = 0h
 * 4. Simulation Controls → Блок с кнопками симуляции
 * 
 * НЕ показывает: price, pnl, candles, performance, accuracy, win rate
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, Shield, Target, Activity, GitCompare,
  RefreshCw, Loader2, AlertTriangle, CheckCircle, XCircle,
  TrendingUp, TrendingDown, Minus, Info, Zap, Play, Database,
  Shuffle, HelpCircle, Clock
} from 'lucide-react';
import { api } from '../api/client';

// ============ DECISION DISTRIBUTION COMPONENT ============
function DecisionDistribution({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">Decision Distribution</h3>
        </div>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { buy, sell, neutral, buyPlusSell, total, period } = data;
  
  const getStatusColor = (status) => {
    if (status === 'ok') return 'bg-emerald-100 text-emerald-700';
    if (status === 'warning') return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">Decision Distribution</h3>
        </div>
        <span className="text-sm text-gray-500">{total} decisions ({period})</span>
      </div>

      {/* Progress bars */}
      <div className="space-y-4">
        {/* NEUTRAL */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Minus className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">NEUTRAL</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(neutral.status)}`}>
                {neutral.status}
              </span>
            </div>
            <span className="text-sm font-semibold">{neutral.pct.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gray-400 rounded-full transition-all"
              style={{ width: `${neutral.pct}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Target: 60-85%</p>
        </div>

        {/* BUY */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium">BUY</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(buy.status)}`}>
                {buy.status}
              </span>
            </div>
            <span className="text-sm font-semibold">{buy.pct.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${buy.pct}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Target: 7-20%</p>
        </div>

        {/* SELL */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium">SELL</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(sell.status)}`}>
                {sell.status}
              </span>
            </div>
            <span className="text-sm font-semibold">{sell.pct.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500 rounded-full transition-all"
              style={{ width: `${sell.pct}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Target: 7-20%</p>
        </div>
      </div>

      {/* BUY+SELL summary */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">BUY + SELL Total</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{buyPlusSell.pct.toFixed(1)}%</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(buyPlusSell.status)}`}>
              {buyPlusSell.status === 'ok' ? '≤40%' : '>40%'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ COVERAGE GATING COMPONENT ============
function CoverageGating({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold">Coverage Gating</h3>
        </div>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { avgCoverageBuySell, avgCoverageNeutral, buySellAtLowCoverage, coverageVariance, period } = data;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold">Coverage Gating</h3>
        </div>
        <span className="text-sm text-gray-500">{period}</span>
      </div>

      {/* Critical check */}
      <div className={`p-4 rounded-lg mb-4 ${buySellAtLowCoverage.status === 'ok' ? 'bg-emerald-50' : 'bg-red-50'}`}>
        <div className="flex items-center gap-2">
          {buySellAtLowCoverage.status === 'ok' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <div>
            <p className={`font-medium ${buySellAtLowCoverage.status === 'ok' ? 'text-emerald-700' : 'text-red-700'}`}>
              BUY/SELL at Low Coverage: {buySellAtLowCoverage.count}
            </p>
            <p className="text-sm text-gray-600">
              {buySellAtLowCoverage.status === 'ok' 
                ? 'No decisions at coverage <60%' 
                : `${buySellAtLowCoverage.pct.toFixed(1)}% decisions at low coverage`}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Avg Coverage (BUY/SELL)</p>
          <p className="text-xl font-semibold">{avgCoverageBuySell.toFixed(1)}%</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Avg Coverage (NEUTRAL)</p>
          <p className="text-xl font-semibold">{avgCoverageNeutral.toFixed(1)}%</p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          <Info className="w-4 h-4 inline mr-1" />
          Coverage variance: {coverageVariance.toFixed(2)}
        </p>
      </div>
    </div>
  );
}

// ============ EVIDENCE VS RISK SCATTER WITH DECISION GATE OVERLAY ============
function EvidenceRiskScatter({ decisions, loading, thresholds }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold">Evidence vs Risk</h3>
        </div>
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // Get thresholds from API or use defaults
  const evidenceMin = thresholds?.evidence?.softZoneMax || 65;
  const evidenceHard = thresholds?.evidence?.minForAnyDecision || 50;
  const riskMax = thresholds?.risk?.highRiskZone || 60;
  const riskHardCap = thresholds?.risk?.hardCap || 75;

  // Build scatter data
  const scatterData = (decisions || []).map(d => ({
    evidence: d.scores?.evidence || 0,
    risk: d.scores?.risk || 0,
    decision: d.decision,
  }));

  // Group by zones based on actual thresholds
  const zones = {
    safe: scatterData.filter(d => d.evidence >= evidenceMin && d.risk < riskMax),
    risky: scatterData.filter(d => d.risk >= riskMax),
    weak: scatterData.filter(d => d.evidence < evidenceMin && d.risk < riskMax),
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold">Evidence vs Risk with Decision Gates</h3>
        </div>
        <span className="text-sm text-gray-500">{scatterData.length} decisions</span>
      </div>

      {/* Simple visualization with Decision Gate Overlay */}
      <div className="relative h-52 bg-slate-50 rounded-lg overflow-hidden">
        {/* Grid */}
        <div className="absolute inset-0 grid grid-cols-5 grid-rows-5">
          {[...Array(25)].map((_, i) => (
            <div key={i} className="border border-slate-100" />
          ))}
        </div>
        
        {/* DECISION GATE OVERLAY - BUY/SELL allowed zone */}
        {/* Based on actual thresholds from API */}
        <div 
          className="absolute bg-teal-100/50 border-2 border-teal-500 border-dashed rounded"
          style={{
            left: `${evidenceMin}%`,
            bottom: `${100 - riskMax}%`,
            width: `${100 - evidenceMin}%`,
            height: `${riskMax}%`,
          }}
          title={`Decision Gate: Evidence ≥${evidenceMin}, Risk <${riskMax}`}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-teal-700 bg-teal-100 px-2 py-1 rounded">
              Decision Gate
            </span>
          </div>
        </div>
        
        {/* AUTO-NEUTRAL zones overlay */}
        {/* High Risk zone (Risk >= hardCap) - auto NEUTRAL */}
        <div 
          className="absolute bg-red-100/40"
          style={{
            left: '0',
            top: '0',
            width: '100%',
            height: `${100 - riskHardCap}%`,
          }}
        />
        
        {/* Moderate Risk zone (Risk >= riskMax) - conditional */}
        <div 
          className="absolute bg-orange-100/30"
          style={{
            left: '0',
            top: `${100 - riskHardCap}%`,
            width: '100%',
            height: `${riskHardCap - riskMax}%`,
          }}
        />
        
        {/* Low Evidence zone (Evidence < hardMin) - auto NEUTRAL */}
        <div 
          className="absolute bg-amber-100/40"
          style={{
            left: '0',
            bottom: '0',
            width: `${evidenceHard}%`,
            height: '100%',
          }}
        />
        
        {/* Zone labels */}
        <div className="absolute top-2 right-2 text-xs text-red-600 bg-red-100 px-2 py-1 rounded font-medium">
          Auto-NEUTRAL (Risk ≥{riskHardCap})
        </div>
        <div className="absolute top-8 right-2 text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded font-medium">
          Conditional (Risk ≥{riskMax})
        </div>
        <div className="absolute bottom-2 left-2 text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded font-medium">
          Auto-NEUTRAL (Evidence &lt;{evidenceHard})
        </div>

        {/* Dots */}
        {scatterData.map((d, i) => (
          <div
            key={i}
            className={`absolute w-2.5 h-2.5 rounded-full transform -translate-x-1 -translate-y-1 z-10 ${
              d.decision === 'BUY' ? 'bg-emerald-500 ring-1 ring-emerald-600' :
              d.decision === 'SELL' ? 'bg-red-500 ring-1 ring-red-600' : 'bg-slate-400'
            }`}
            style={{
              left: `${d.evidence}%`,
              bottom: `${100 - d.risk}%`,
            }}
            title={`Evidence: ${d.evidence}, Risk: ${d.risk}, Decision: ${d.decision}`}
          />
        ))}

        {/* Axis labels */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-xs text-slate-400 font-medium">
          Evidence →
        </div>
        <div className="absolute left-1 top-1/2 transform -translate-y-1/2 -rotate-90 text-xs text-slate-400 font-medium">
          ← Risk
        </div>
      </div>

      {/* Zone stats */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="text-center p-2 bg-teal-50 rounded border border-teal-200">
          <p className="text-lg font-semibold text-teal-600">{zones.safe.length}</p>
          <p className="text-xs text-gray-500">Decision Gate Zone</p>
        </div>
        <div className="text-center p-2 bg-red-50 rounded">
          <p className="text-lg font-semibold text-red-600">{zones.risky.length}</p>
          <p className="text-xs text-gray-500">Auto-NEUTRAL (Risk)</p>
        </div>
        <div className="text-center p-2 bg-amber-50 rounded">
          <p className="text-lg font-semibold text-amber-600">{zones.weak.length}</p>
          <p className="text-xs text-gray-500">Auto-NEUTRAL (Evidence)</p>
        </div>
      </div>

      {/* Explanation with thresholds */}
      <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-xs text-slate-600 font-medium mb-1">Decision Gate Rules (from Engine v1.1)</p>
        <p className="text-xs text-slate-500">
          BUY/SELL requires: Evidence ≥{evidenceMin}, Risk &lt;{riskMax}, Coverage ≥60%, No conflicts
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Points outside the Decision Gate are automatically NEUTRAL by design.
        </p>
      </div>
    </div>
  );
}

// ============ STABILITY KPI COMPONENT WITH TOOLTIP ============
function StabilityKPI({ data, loading }) {
  const [showLifespanTooltip, setShowLifespanTooltip] = useState(false);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-cyan-600" />
          <h3 className="font-semibold">Stability</h3>
        </div>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { flipRate24h, medianDecisionLifespanHours, decisionsChangedWithoutInputChange, status, period } = data;

  const getStatusColor = (status) => {
    if (status === 'ok') return 'bg-emerald-100 text-emerald-700';
    if (status === 'warning') return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  const isLifespanZero = medianDecisionLifespanHours === 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-600" />
          <h3 className="font-semibold">Stability</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(status)}`}>
            {status}
          </span>
        </div>
        <span className="text-sm text-gray-500">{period}</span>
      </div>

      <div className="space-y-4">
        {/* Flip Rate */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">Flip Rate (24h)</span>
            <span className={`font-semibold ${flipRate24h > 15 ? 'text-red-600' : 'text-emerald-600'}`}>
              {flipRate24h.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${flipRate24h > 15 ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, flipRate24h * 100 / 30)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Target: &lt;15%</p>
        </div>

        {/* Median Lifespan with Tooltip */}
        <div className="relative">
          <div 
            className="p-3 bg-gray-50 rounded-lg cursor-help"
            onMouseEnter={() => isLifespanZero && setShowLifespanTooltip(true)}
            onMouseLeave={() => setShowLifespanTooltip(false)}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 flex items-center gap-1">
                Median Decision Lifespan
                {isLifespanZero && <HelpCircle className="w-3 h-3 text-gray-400" />}
              </p>
            </div>
            <p className="text-xl font-semibold">{medianDecisionLifespanHours.toFixed(1)}h</p>
            <p className="text-xs text-gray-500">Target: ≥4h</p>
            {isLifespanZero && (
              <p className="text-xs text-slate-400 mt-1 italic">No BUY/SELL decisions yet</p>
            )}
          </div>
          
          {/* Tooltip for zero lifespan */}
          {showLifespanTooltip && isLifespanZero && (
            <div className="absolute z-20 left-0 right-0 mt-2 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg">
              <p className="font-medium mb-1">Why is median lifespan zero?</p>
              <p className="text-gray-700">
                All decisions are currently NEUTRAL and re-evaluated continuously during data collection phase. 
                Lifespan tracking starts when BUY/SELL decisions appear.
              </p>
            </div>
          )}
        </div>

        {/* Changed without input */}
        <div className={`p-3 rounded-lg ${decisionsChangedWithoutInputChange > 0 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
          <p className="text-sm text-gray-600">Changed Without Input Change</p>
          <p className={`text-xl font-semibold ${decisionsChangedWithoutInputChange > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {decisionsChangedWithoutInputChange}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============ SHADOW AGREEMENT COMPONENT ============
function ShadowAgreement({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <GitCompare className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold">Shadow Mode (v1.1 vs v2)</h3>
        </div>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { 
    totalComparisons, agreementRate, v2MoreAggressiveRate, v2LessAggressiveRate,
    avgEvidenceDiff, avgRiskDiff, v2BuySellAtLowCoverage, killConditionsPassed,
    killConditionsDetails, period
  } = data;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold">Shadow Mode (v1.1 vs v2)</h3>
        </div>
        <span className="text-sm text-gray-500">{totalComparisons} comparisons ({period})</span>
      </div>

      {/* Kill conditions status */}
      <div className={`p-4 rounded-lg mb-4 ${killConditionsPassed ? 'bg-emerald-50' : 'bg-red-50'}`}>
        <div className="flex items-center gap-2">
          {killConditionsPassed ? (
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600" />
          )}
          <div>
            <p className={`font-medium ${killConditionsPassed ? 'text-emerald-700' : 'text-red-700'}`}>
              Kill Conditions: {killConditionsPassed ? 'PASSED' : 'FAILED'}
            </p>
            <p className="text-sm text-gray-600">
              {killConditionsPassed 
                ? 'v2 is safe for production consideration' 
                : 'v2 cannot be promoted to production'}
            </p>
          </div>
        </div>
      </div>

      {/* Agreement Rate */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-600">Agreement Rate</span>
          <span className={`font-semibold ${agreementRate >= 70 ? 'text-emerald-600' : 'text-red-600'}`}>
            {agreementRate.toFixed(1)}%
          </span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${agreementRate >= 70 ? 'bg-emerald-500' : 'bg-red-500'}`}
            style={{ width: `${agreementRate}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">Target: ≥70%</p>
      </div>

      {/* Comparison stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-orange-50 rounded-lg">
          <p className="text-sm text-gray-500">v2 More Aggressive</p>
          <p className="text-lg font-semibold text-orange-600">{v2MoreAggressiveRate.toFixed(1)}%</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-500">v2 Less Aggressive</p>
          <p className="text-lg font-semibold text-blue-600">{v2LessAggressiveRate.toFixed(1)}%</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Avg Evidence Diff</p>
          <p className="text-lg font-semibold">{avgEvidenceDiff >= 0 ? '+' : ''}{avgEvidenceDiff.toFixed(1)}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Avg Risk Diff</p>
          <p className="text-lg font-semibold">{avgRiskDiff >= 0 ? '+' : ''}{avgRiskDiff.toFixed(1)}</p>
        </div>
      </div>

      {/* v2 at low coverage */}
      {v2BuySellAtLowCoverage > 0 && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg">
          <p className="text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 inline mr-1" />
            v2 made {v2BuySellAtLowCoverage} BUY/SELL at low coverage - CRITICAL
          </p>
        </div>
      )}
    </div>
  );
}

// ============ SIMULATION CONTROLS COMPONENT (NEW) ============
function SimulationControls({ onRunSimulation }) {
  const [running, setRunning] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const runSimulation = async (type) => {
    setRunning(type);
    setLastResult(null);
    
    try {
      let endpoint = '';
      let body = {};
      
      switch (type) {
        case 'replay':
          endpoint = '/api/engine/simulate/replay';
          body = { limit: 30 };
          break;
        case 'perturb':
          endpoint = '/api/engine/simulate/perturb';
          body = { actor: 'binance' };
          break;
        case 'montecarlo':
          endpoint = '/api/engine/simulate/montecarlo';
          body = { iterations: 30 };
          break;
      }
      
      const res = await api.post(endpoint, body);
      if (res.data.ok) {
        setLastResult(res.data.data.summary);
        if (onRunSimulation) onRunSimulation();
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Play className="w-5 h-5 text-violet-600" />
          <h3 className="font-semibold">Simulation Controls</h3>
        </div>
        <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded">
          Test Mode
        </span>
      </div>

      {/* Simulation buttons */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <button
          onClick={() => runSimulation('replay')}
          disabled={running !== null}
          className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {running === 'replay' ? (
            <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
          ) : (
            <Database className="w-5 h-5 text-violet-600" />
          )}
          <span className="text-sm font-medium">Historical Replay</span>
          <span className="text-xs text-gray-500">All actors × windows</span>
        </button>
        
        <button
          onClick={() => runSimulation('perturb')}
          disabled={running !== null}
          className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {running === 'perturb' ? (
            <Loader2 className="w-5 h-5 animate-spin text-orange-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          )}
          <span className="text-sm font-medium">Stress Test</span>
          <span className="text-xs text-gray-500">Perturbations</span>
        </button>
        
        <button
          onClick={() => runSimulation('montecarlo')}
          disabled={running !== null}
          className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {running === 'montecarlo' ? (
            <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
          ) : (
            <Shuffle className="w-5 h-5 text-cyan-600" />
          )}
          <span className="text-sm font-medium">Monte Carlo</span>
          <span className="text-xs text-gray-500">Random features</span>
        </button>
      </div>

      {/* Last result */}
      {lastResult && (
        <div className="p-3 bg-gray-50 rounded-lg mb-3">
          <p className="text-sm font-medium mb-2">Last Simulation Result:</p>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <p className="font-semibold text-gray-500">{lastResult.neutral}</p>
              <p className="text-xs text-gray-400">NEUTRAL</p>
            </div>
            <div>
              <p className="font-semibold text-emerald-600">{lastResult.buy}</p>
              <p className="text-xs text-gray-400">BUY</p>
            </div>
            <div>
              <p className="font-semibold text-red-600">{lastResult.sell}</p>
              <p className="text-xs text-gray-400">SELL</p>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="p-2 bg-amber-50 rounded text-xs text-amber-700 flex items-start gap-2">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>Simulated decisions do not affect production KPIs. Use for testing decision rules and boundaries.</span>
      </div>
    </div>
  );
}

// ============ HISTORICAL MARKET RESPONSE (Moved from Entities - Layer 2) ============

function HistoricalMarketResponse() {
  // Example historical statistics - in production would come from API
  const historicalStats = {
    condition: 'Net inflow > $100M in 24h',
    occurrences: 47,
    marketUpPct: 72,
    avgLagDays: 1.3,
    medianMove: '+3.2%'
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold">Historical Market Response</h3>
        </div>
        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
          DERIVED
        </span>
      </div>

      <div className="p-4 bg-white text-white rounded-xl mb-4">
        <div className="text-xs text-gray-400 mb-1">CONDITION</div>
        <div className="text-lg font-bold">{historicalStats.condition}</div>
        <div className="text-xs text-gray-400 mt-1">{historicalStats.occurrences} occurrences in last 180 days</div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 rounded-xl text-center">
          <div className="text-2xl font-bold text-gray-900">{historicalStats.marketUpPct}%</div>
          <div className="text-xs text-gray-500 mt-1">Market moved up after</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl text-center">
          <div className="text-2xl font-bold text-gray-900">{historicalStats.avgLagDays}d</div>
          <div className="text-xs text-gray-500 mt-1">Avg lag to reaction</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl text-center">
          <div className="text-2xl font-bold text-gray-900">{historicalStats.medianMove}</div>
          <div className="text-xs text-gray-500 mt-1">Median price move</div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
        <p className="text-xs text-indigo-700">
          <Info className="w-3 h-3 inline mr-1" />
          Statistics describe <span className="font-semibold">historical correlation</span>, not causation. Use for research only.
        </p>
      </div>
    </div>
  );
}

// ============ OVERALL HEALTH BADGE (UPDATED FOR v1.05) ============
function OverallHealth({ health, coverage, thresholds }) {
  // v1.05: Replace "Warning" with "DATA COLLECTION MODE" status
  const minCoverage = thresholds?.coverage?.normalZone || 60;
  const isDataCollection = coverage !== undefined && coverage < minCoverage;
  
  if (isDataCollection) {
    return (
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-5">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-slate-100 rounded-lg">
            <Database className="w-6 h-6 text-slate-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-700">
              Engine Status: DATA COLLECTION MODE
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Engine is operating in protection mode while data coverage is below decision thresholds.
            </p>
            
            {/* Dynamic bullet points */}
            <ul className="mt-3 space-y-2">
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Coverage below minimum decision threshold ({coverage?.toFixed(0) || 0}% / {minCoverage}%)
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                BUY/SELL decisions are temporarily gated
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                All decisions default to NEUTRAL by design
              </li>
            </ul>
            
            {/* Gating status badge */}
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
              <Shield className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-medium text-slate-600">Decision Gating: ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const config = {
    healthy: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: CheckCircle, label: 'Healthy' },
    warning: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: AlertTriangle, label: 'Warning' },
    critical: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: XCircle, label: 'Critical' },
  };

  const c = config[health] || config.warning;
  const Icon = c.icon;

  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${c.bg}`}>
      <Icon className={`w-5 h-5 ${c.text}`} />
      <span className={`font-semibold ${c.text}`}>Engine Health: {c.label}</span>
    </div>
  );
}

// ============ MAIN DASHBOARD COMPONENT ============
export default function EngineDashboard() {
  const [loading, setLoading] = useState(true);
  const [kpi, setKpi] = useState(null);
  const [shadowKpi, setShadowKpi] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [engineConfig, setEngineConfig] = useState(null);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('7');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [kpiRes, shadowRes, decisionsRes, configRes] = await Promise.all([
        api.get(`/api/engine/kpi?days=${period}`),
        api.get(`/api/engine/shadow/kpi?days=${period}`),
        api.get('/api/engine/decisions?limit=100'),
        api.get('/api/engine/config'),
      ]);

      if (kpiRes.data.ok) setKpi(kpiRes.data.data);
      if (shadowRes.data.ok) setShadowKpi(shadowRes.data.data);
      if (decisionsRes.data.ok) setDecisions(decisionsRes.data.data.decisions || []);
      if (configRes.data.ok) setEngineConfig(configRes.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  // Calculate average coverage for health banner
  const avgCoverage = kpi?.coverage?.avgCoverageNeutral || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Engine Dashboard</h1>
            <p className="text-gray-500">Quality Control - Decision Analysis</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Period selector */}
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="1">Last 24h</option>
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
            </select>

            {/* Refresh */}
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </button>

            {/* Back to Engine */}
            <Link
              to="/engine"
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <Zap className="w-4 h-4" />
              Engine
            </Link>
          </div>
        </div>

        {/* Overall health - v1.05: DATA COLLECTION status */}
        {kpi && (
          <div className="mb-6">
            <OverallHealth 
              health={kpi.overallHealth} 
              coverage={avgCoverage} 
              thresholds={engineConfig?.thresholds}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
            Error: {error}
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Row 1 */}
          <DecisionDistribution data={kpi?.distribution} loading={loading} />
          <CoverageGating data={kpi?.coverage} loading={loading} />
          
          {/* Row 2 */}
          <EvidenceRiskScatter decisions={decisions} loading={loading} thresholds={engineConfig?.thresholds} />
          <StabilityKPI data={kpi?.stability} loading={loading} />
          
          {/* Row 3 - Simulation Controls */}
          <SimulationControls onRunSimulation={fetchData} />
          
          {/* Shadow Agreement */}
          <ShadowAgreement data={shadowKpi} loading={loading} />
          
          {/* Row 4 - Historical Market Response (Moved from Entities - Layer 2 metrics) */}
          <HistoricalMarketResponse />
        </div>

        {/* Engine Info */}
        <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">
            <Info className="w-4 h-4 inline mr-1" />
            <strong>Engine {engineConfig?.version || 'v1.1'}</strong> | Shadow Mode: Active | ML: Disabled | 
            This dashboard shows quality metrics, not trading performance.
          </p>
        </div>
      </main>
    </div>
  );
}
