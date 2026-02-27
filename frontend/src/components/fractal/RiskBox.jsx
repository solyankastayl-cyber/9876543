/**
 * U7 — Risk Box 2.0
 * 
 * Shows risk assessment and position sizing with human-readable explanations:
 * - RiskHeader: Risk level, Vol Regime, Drift status
 * - DrawdownStats: avgMaxDD, tailRiskP95
 * - PositionSizing: Final size with bullet reasons
 * - Blockers: Trading disabled warnings
 */

import React, { useState } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  AlertOctagon,
  TrendingDown, 
  Scale,
  ChevronDown,
  ChevronUp,
  Ban,
  Activity,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { formatPrice as formatPriceUtil } from '../../utils/priceFormatter';

// ═══════════════════════════════════════════════════════════════
// RISK HEADER
// ═══════════════════════════════════════════════════════════════

function RiskHeader({ riskLevel, volRegime, driftStatus }) {
  const riskConfigs = {
    NORMAL: { 
      icon: Shield, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50/50', 
      label: 'NORMAL',
      description: 'Standard market conditions'
    },
    ELEVATED: { 
      icon: AlertTriangle, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50/50', 
      label: 'ELEVATED',
      description: 'Increased caution advised'
    },
    CRISIS: { 
      icon: AlertOctagon, 
      color: 'text-red-600', 
      bg: 'bg-red-50/50', 
      label: 'CRISIS',
      description: 'High risk environment'
    },
  };
  
  const volConfigs = {
    LOW: { color: 'text-emerald-600' },
    MEDIUM: { color: 'text-blue-600' },
    HIGH: { color: 'text-amber-600' },
    CRISIS: { color: 'text-red-600' },
    CONTRACTION: { color: 'text-emerald-600' },
    EXPANSION: { color: 'text-amber-600' },
  };
  
  const riskConfig = riskConfigs[riskLevel] || riskConfigs.NORMAL;
  const volConfig = volConfigs[volRegime] || volConfigs.MEDIUM;
  const RiskIcon = riskConfig.icon;
  
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${riskConfig.bg}`}>
      <div className="flex items-center gap-2">
        <RiskIcon className={`w-6 h-6 ${riskConfig.color}`} />
        <div>
          <div className={`text-base font-bold ${riskConfig.color}`}>
            Risk: {riskConfig.label}
          </div>
          <div className="text-[10px] text-slate-500">{riskConfig.description}</div>
        </div>
      </div>
      
      <div className="text-right">
        <div className="text-[10px] text-slate-500 uppercase">Vol Regime</div>
        <div className={`text-sm font-bold ${volConfig.color}`}>{volRegime || 'MEDIUM'}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DRAWDOWN STATS - COMPACT
// ═══════════════════════════════════════════════════════════════

function DrawdownStats({ avgMaxDD, tailRiskP95 }) {
  const formatPct = (v) => {
    if (v === undefined || v === null) return '—';
    return `${(v * 100).toFixed(1)}%`;
  };
  
  return (
    <div className="grid grid-cols-2 gap-3 mt-4">
      {/* Average Drawdown */}
      <div 
        className="p-4 bg-slate-50 rounded-lg"
        title="Average maximum drawdown observed within the forecast horizon across all historical matches"
      >
        <div className="flex items-center gap-2 mb-2">
          <TrendingDown className="w-4 h-4 text-amber-500" />
          <span className="text-xs text-slate-500">Typical Pullback</span>
        </div>
        <div className="text-2xl font-bold text-amber-600">{formatPct(avgMaxDD)}</div>
        <div className="text-[10px] text-slate-400 mt-1">
          Average worst-case within horizon
        </div>
      </div>
      
      {/* Worst-case Scenario */}
      <div 
        className="p-4 bg-slate-50 rounded-lg"
        title="5th percentile of returns — the level exceeded only 5% of the time (worst outcomes)"
      >
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-xs text-slate-500">Worst-case (5%)</span>
        </div>
        <div className="text-2xl font-bold text-red-600">{formatPct(tailRiskP95)}</div>
        <div className="text-[10px] text-slate-400 mt-1">
          5% worst historical outcomes
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMBINED RISK + POSITION (Compact)
// ═══════════════════════════════════════════════════════════════

function CombinedRiskPosition({ riskLevel, volRegime, sizing, constitution, driftStatus }) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Risk config
  const RISK_CONFIG = {
    CRISIS: { 
      label: 'CRISIS', 
      color: 'text-red-600', 
      bg: 'bg-red-50',
      icon: AlertOctagon,
      description: 'High risk environment'
    },
    ELEVATED: { 
      label: 'ELEVATED', 
      color: 'text-amber-600', 
      bg: 'bg-amber-50',
      icon: AlertTriangle,
      description: 'Elevated risk conditions'
    },
    NORMAL: { 
      label: 'NORMAL', 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      icon: Shield,
      description: 'Normal conditions'
    }
  };
  
  const riskConfig = RISK_CONFIG[riskLevel] || RISK_CONFIG.NORMAL;
  const RiskIcon = riskConfig.icon;
  
  // Position sizing
  const { 
    finalSize = 0, 
    sizeLabel = 'NONE', 
    breakdown = [],
    explain = [],
    blockers: sizingBlockers = []
  } = sizing || {};
  
  // Combine all blockers for tooltip
  const allBlockers = [...(sizingBlockers || [])];
  if (constitution?.status === 'BLOCK') allBlockers.push('CONSTITUTION_BLOCK');
  if (driftStatus === 'CRITICAL') allBlockers.push('DRIFT_CRITICAL');
  
  const blockerExplain = {
    'LOW_CONFIDENCE': 'Model confidence too low',
    'HIGH_ENTROPY': 'High prediction uncertainty',
    'VOL_CRISIS': 'Volatility in crisis mode',
    'EXTREME_VOL_SPIKE': 'Extreme volatility spike detected',
    'CONSTITUTION_BLOCK': 'Risk guardrails activated',
    'DRIFT_CRITICAL': 'Model drift critical',
    'NO_SIGNAL': 'No clear trading signal',
    'CONFLICT_HIGH': 'High horizon conflict',
  };
  
  const hasBlockers = allBlockers.length > 0 || finalSize <= 0;
  
  // Position color
  let sizeColor = 'text-emerald-600';
  if (finalSize <= 0) {
    sizeColor = 'text-red-600';
  } else if (finalSize < 0.25) {
    sizeColor = 'text-amber-600';
  }
  
  // Top reasons
  const topReasons = breakdown
    .filter(b => b.severity === 'CRITICAL' || b.multiplier < 0.5)
    .slice(0, 3)
    .map(b => b.note);
  const displayReasons = topReasons.length > 0 ? topReasons : (explain || []).slice(0, 3);
  
  return (
    <div 
      className={`p-4 rounded-lg ${riskConfig.bg} relative`}
      onMouseEnter={() => hasBlockers && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Top Row: Risk + Position */}
      <div className="flex items-center justify-between mb-3">
        {/* Left: Risk Level */}
        <div className="flex items-center gap-3">
          <RiskIcon className={`w-7 h-7 ${riskConfig.color}`} />
          <div>
            <div className={`text-base font-bold ${riskConfig.color}`}>
              Risk: {riskConfig.label}
            </div>
            <div className="text-xs text-slate-500">{riskConfig.description}</div>
          </div>
        </div>
        
        {/* Right: Position Size */}
        <div className="text-right cursor-help">
          <div className="text-[10px] text-slate-500 uppercase">Position</div>
          <div className={`text-xl font-bold ${sizeColor}`}>
            {finalSize > 0 ? `${(finalSize * 100).toFixed(0)}%` : 'NO TRADE'}
            <span className="text-sm font-normal text-slate-400 ml-1">
              {finalSize.toFixed(2)}x
            </span>
          </div>
        </div>
      </div>
      
      {/* Reasons */}
      {displayReasons.length > 0 && (
        <div className="pt-3 border-t border-slate-200/50">
          <div className="text-[10px] text-slate-500 uppercase mb-2">Reasons:</div>
          <div className="space-y-1">
            {displayReasons.map((reason, i) => (
              <div key={i} className="text-xs text-slate-600 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                {reason}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Tooltip */}
      {showTooltip && hasBlockers && (
        <div className="absolute right-0 bottom-full mb-2 z-50 w-64 p-3 bg-slate-800 rounded-lg shadow-xl text-white text-xs">
          <div className="flex items-center gap-2 mb-2 text-red-400 font-semibold">
            <Ban className="w-4 h-4" />
            Trading Disabled
          </div>
          <div className="space-y-1.5">
            {allBlockers.length > 0 ? (
              allBlockers.map((blocker, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-300">
                  <XCircle className="w-3 h-3 text-red-400" />
                  <span>{blockerExplain[blocker] || blocker}</span>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 text-slate-300">
                <XCircle className="w-3 h-3 text-red-400" />
                <span>Position size reduced to zero</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// POSITION SIZING (kept for reference but not used)
// ═══════════════════════════════════════════════════════════════

function PositionSizing({ sizing, blockers, constitution, driftStatus }) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  if (!sizing) return null;
  
  const { 
    finalSize = 0, 
    finalPercent = 0,
    sizeLabel = 'NONE', 
    breakdown = [],
    explain = [],
    blockers: sizingBlockers = [],
    formula,
    mode
  } = sizing;
  
  // Combine all blockers for tooltip
  const allBlockers = [...(sizingBlockers || [])];
  if (constitution?.status === 'BLOCK') allBlockers.push('CONSTITUTION_BLOCK');
  if (driftStatus === 'CRITICAL') allBlockers.push('DRIFT_CRITICAL');
  
  const blockerExplain = {
    'LOW_CONFIDENCE': 'Model confidence too low',
    'HIGH_ENTROPY': 'High prediction uncertainty',
    'VOL_CRISIS': 'Volatility in crisis mode',
    'EXTREME_VOL_SPIKE': 'Extreme volatility spike detected',
    'CONSTITUTION_BLOCK': 'Risk guardrails activated',
    'DRIFT_CRITICAL': 'Model drift critical',
    'NO_SIGNAL': 'No clear trading signal',
    'CONFLICT_HIGH': 'High horizon conflict',
  };
  
  // Determine color based on size
  let sizeColor = 'text-emerald-600';
  let sizeBg = 'bg-emerald-50';
  
  if (finalSize <= 0) {
    sizeColor = 'text-red-600';
    sizeBg = 'bg-red-50';
  } else if (finalSize < 0.25) {
    sizeColor = 'text-amber-600';
    sizeBg = 'bg-amber-50';
  } else if (finalSize < 0.5) {
    sizeColor = 'text-blue-600';
    sizeBg = 'bg-blue-50';
  }
  
  // Extract top reasons from breakdown
  const topReasons = breakdown
    .filter(b => b.severity === 'CRITICAL' || b.multiplier < 0.5)
    .slice(0, 3)
    .map(b => b.note);
  
  // If no critical reasons, use explain
  const displayReasons = topReasons.length > 0 ? topReasons : explain.slice(0, 3);
  
  const hasBlockers = allBlockers.length > 0 || finalSize <= 0;
  
  return (
    <div className="mt-4">
      {/* Main Size Display - with tooltip on hover */}
      <div 
        className={`p-4 rounded-xl ${sizeBg} relative`}
        onMouseEnter={() => hasBlockers && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="flex items-center justify-between cursor-help">
          <div className="flex items-center gap-3">
            <Scale className={`w-6 h-6 ${sizeColor}`} />
            <div>
              <div className="text-xs text-slate-500 uppercase">Recommended Position</div>
              <div className={`text-2xl font-bold ${sizeColor}`}>
                {finalSize > 0 ? `${(finalSize * 100).toFixed(0)}%` : 'NO TRADE'}
                <span className="text-sm font-normal text-slate-400 ml-2">
                  ({sizeLabel})
                </span>
              </div>
            </div>
          </div>
          
          {/* Size Badge */}
          <div className={`px-4 py-2 rounded-lg ${sizeBg}`}>
            <span className={`text-lg font-bold ${sizeColor}`}>
              {finalSize.toFixed(2)}x
            </span>
          </div>
        </div>
        
        {/* Trading Disabled Tooltip */}
        {showTooltip && hasBlockers && (
          <div className="absolute right-0 bottom-full mb-2 z-50 w-72 p-3 bg-slate-800 rounded-lg shadow-xl text-white text-xs">
            <div className="flex items-center gap-2 mb-2 text-red-400 font-semibold">
              <Ban className="w-4 h-4" />
              Trading Disabled
            </div>
            <div className="space-y-1.5">
              {allBlockers.length > 0 ? (
                allBlockers.map((blocker, i) => (
                  <div key={i} className="flex items-center gap-2 text-slate-300">
                    <XCircle className="w-3 h-3 text-red-400" />
                    <span>{blockerExplain[blocker] || blocker}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2 text-slate-300">
                  <XCircle className="w-3 h-3 text-red-400" />
                  <span>Position size reduced to zero</span>
                </div>
              )}
            </div>
            <div className="mt-2 pt-2 border-t border-slate-600 text-slate-400">
              Position sizing at 0% until conditions improve
            </div>
          </div>
        )}
        
        {/* Reasons */}
        {displayReasons.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="text-xs text-slate-500 uppercase mb-2">Reasons:</div>
            <ul className="space-y-1">
              {displayReasons.map((reason, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN RISK BOX
// ═══════════════════════════════════════════════════════════════

export function RiskBox({ 
  scenario, 
  volatility, 
  sizing, 
  constitution,
  driftStatus,
  asset = 'BTC'  // Asset for price formatting
}) {
  // Derive risk level from volatility and scenario
  let riskLevel = 'NORMAL';
  const volRegime = volatility?.regime;
  const avgMaxDD = scenario?.avgMaxDD;
  
  if (volRegime === 'CRISIS' || avgMaxDD < -0.25) {
    riskLevel = 'CRISIS';
  } else if (volRegime === 'HIGH' || volRegime === 'EXPANSION' || avgMaxDD < -0.15) {
    riskLevel = 'ELEVATED';
  }
  
  return (
    <div 
      className="bg-white rounded-xl p-4"
      data-testid="risk-box"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
          Risk & Position
        </h3>
        {sizing?.mode && (
          <span className={`text-[10px] font-semibold uppercase ${
            sizing.mode === 'NO_TRADE' ? 'text-red-600' :
            sizing.mode === 'CONSERVATIVE' ? 'text-amber-600' :
            'text-emerald-600'
          }`}>
            {sizing.mode === 'NO_TRADE' ? 'NO TRADE' : sizing.mode}
          </span>
        )}
      </div>
      
      {/* Combined Risk + Position Block */}
      <CombinedRiskPosition 
        riskLevel={riskLevel}
        volRegime={volRegime}
        sizing={sizing}
        constitution={constitution}
        driftStatus={driftStatus}
      />
      
      {/* Drawdown Stats */}
      <DrawdownStats 
        avgMaxDD={scenario?.avgMaxDD}
        tailRiskP95={scenario?.tailRiskP95}
      />
      
      {/* Data Source indicator for SPX */}
      {asset === 'SPX' && (
        <div className="mt-3 pt-2 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 text-center">
            Source: SPX historical matches
          </p>
        </div>
      )}
    </div>
  );
}

export default RiskBox;
