/**
 * BLOCK U5 — Human-friendly Signal Header
 * 
 * 4 human-readable cards:
 * 1. Signal: Buy / Hold / Sell (or Neutral)
 * 2. Confidence: Low / Medium / High
 * 3. Market Mode: Accumulation / Markup / Markdown / Distribution
 * 4. Risk: Normal / Elevated / Crisis
 * 
 * Raw scores (Consensus 50, Div C, F 33%) in tooltips and advanced mode.
 */

import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  Shield, 
  Activity,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// SIGNAL CARD
// ═══════════════════════════════════════════════════════════════

function SignalCard({ signal, consensus, dispersion }) {
  // signal: 'BUY' | 'SELL' | 'HOLD' | 'NEUTRAL'
  const configs = {
    BUY: {
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      label: 'BUY',
      description: 'Favorable outlook',
    },
    SELL: {
      icon: TrendingDown,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      label: 'SELL',
      description: 'Risk reduction advised',
    },
    HOLD: {
      icon: Minus,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      label: 'HOLD',
      description: 'Wait for clarity',
    },
    NEUTRAL: {
      icon: Minus,
      color: 'text-slate-500',
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      label: 'NEUTRAL',
      description: 'Mixed signals',
    },
  };
  
  const config = configs[signal] || configs.NEUTRAL;
  const Icon = config.icon;
  
  const tooltip = `Consensus: ${consensus ? (consensus * 100).toFixed(0) : '—'}% | Dispersion: ${dispersion ? (dispersion * 100).toFixed(0) : '—'}%`;
  
  return (
    <div 
      className={`flex-1 min-w-[140px] p-4 rounded-xl ${config.bg} transition-all hover:shadow-sm`}
      title={tooltip}
      data-testid="signal-card"
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-5 h-5 ${config.color}`} />
        <span className="text-xs font-medium text-slate-500 uppercase">Signal</span>
      </div>
      <div className={`text-2xl font-bold ${config.color}`}>{config.label}</div>
      <div className="text-xs text-slate-500 mt-1">{config.description}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CONFIDENCE CARD
// ═══════════════════════════════════════════════════════════════

function ConfidenceCard({ confidence, reliability, entropy }) {
  // confidence: 0-100
  let level = 'LOW';
  let color = 'text-red-500';
  let bg = 'bg-red-50';
  let border = 'border-red-200';
  let description = 'High uncertainty';
  
  if (confidence >= 70) {
    level = 'HIGH';
    color = 'text-emerald-600';
    bg = 'bg-emerald-50';
    border = 'border-emerald-200';
    description = 'Strong conviction';
  } else if (confidence >= 40) {
    level = 'MEDIUM';
    color = 'text-amber-600';
    bg = 'bg-amber-50';
    border = 'border-amber-200';
    description = 'Moderate certainty';
  }
  
  const tooltip = `Reliability: ${reliability ? (reliability * 100).toFixed(0) : '—'}% | Entropy: ${entropy?.toFixed(2) || '—'}`;
  
  return (
    <div 
      className={`flex-1 min-w-[140px] p-4 rounded-xl ${bg} transition-all hover:shadow-sm`}
      title={tooltip}
      data-testid="confidence-card"
    >
      <div className="flex items-center gap-2 mb-2">
        <Activity className={`w-5 h-5 ${color}`} />
        <span className="text-xs font-medium text-slate-500 uppercase">Confidence</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{level}</div>
      <div className="text-xs text-slate-500 mt-1">{description}</div>
      {/* Progress bar */}
      <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${
            confidence >= 70 ? 'bg-emerald-500' : 
            confidence >= 40 ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${confidence || 0}%` }}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MARKET MODE CARD
// ═══════════════════════════════════════════════════════════════

function MarketModeCard({ phase, phaseConfidence }) {
  const phases = {
    ACCUMULATION: {
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      description: 'Building positions',
    },
    MARKUP: {
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      description: 'Uptrend in progress',
    },
    DISTRIBUTION: {
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      description: 'Smart money selling',
    },
    MARKDOWN: {
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      description: 'Downtrend active',
    },
    RECOVERY: {
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
      border: 'border-cyan-200',
      description: 'Bouncing from lows',
    },
    UNKNOWN: {
      color: 'text-slate-500',
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      description: 'Phase unclear',
    },
  };
  
  const config = phases[phase] || phases.UNKNOWN;
  const displayPhase = phase || 'UNKNOWN';
  
  const tooltip = `Phase confidence: ${phaseConfidence ? (phaseConfidence * 100).toFixed(0) : '—'}%`;
  
  return (
    <div 
      className={`flex-1 min-w-[140px] p-4 rounded-xl ${config.bg} transition-all hover:shadow-sm`}
      title={tooltip}
      data-testid="market-mode-card"
    >
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className={`w-5 h-5 ${config.color}`} />
        <span className="text-xs font-medium text-slate-500 uppercase">Market Mode</span>
      </div>
      <div className={`text-xl font-bold ${config.color}`}>{displayPhase}</div>
      <div className="text-xs text-slate-500 mt-1">{config.description}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// RISK CARD
// ═══════════════════════════════════════════════════════════════

function RiskCard({ riskLevel, avgMaxDD, volatilityRegime }) {
  // riskLevel: 'NORMAL' | 'ELEVATED' | 'CRISIS'
  const configs = {
    NORMAL: {
      icon: Shield,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      description: 'Standard conditions',
    },
    ELEVATED: {
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      description: 'Increased caution',
    },
    CRISIS: {
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      description: 'High risk environment',
    },
  };
  
  const config = configs[riskLevel] || configs.NORMAL;
  const Icon = config.icon;
  
  const tooltip = `Avg Max DD: ${avgMaxDD ? (avgMaxDD * 100).toFixed(1) : '—'}% | Vol Regime: ${volatilityRegime || '—'}`;
  
  return (
    <div 
      className={`flex-1 min-w-[140px] p-4 rounded-xl ${config.bg} transition-all hover:shadow-sm`}
      title={tooltip}
      data-testid="risk-card"
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-5 h-5 ${config.color}`} />
        <span className="text-xs font-medium text-slate-500 uppercase">Risk</span>
      </div>
      <div className={`text-2xl font-bold ${config.color}`}>{riskLevel || 'NORMAL'}</div>
      <div className="text-xs text-slate-500 mt-1">{config.description}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN SIGNAL HEADER
// ═══════════════════════════════════════════════════════════════

export function SignalHeader({ 
  consensus,
  conflict,
  volatility,
  phaseSnapshot,
  diagnostics,
  overlay 
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Derive human-friendly values
  const derived = useMemo(() => {
    // Signal direction
    let signal = 'NEUTRAL';
    const consensusScore = consensus?.score || 0;
    const consensusDir = consensus?.dir;
    
    if (consensusDir === 'BUY' && consensusScore > 0.3) {
      signal = 'BUY';
    } else if (consensusDir === 'SELL' && consensusScore > 0.3) {
      signal = 'SELL';
    } else if (consensusScore > 0.5) {
      signal = consensusDir || 'HOLD';
    } else {
      signal = 'HOLD';
    }
    
    // Confidence level (0-100)
    const reliability = diagnostics?.reliability || 0.5;
    const entropy = diagnostics?.entropy || 0.5;
    const qualityScore = diagnostics?.qualityScore || 0.5;
    const confidenceRaw = (reliability * 0.4 + (1 - entropy) * 0.3 + qualityScore * 0.3) * 100;
    const confidence = Math.max(0, Math.min(100, confidenceRaw));
    
    // Market phase
    const phase = phaseSnapshot?.currentPhase || overlay?.matches?.[0]?.phase || 'UNKNOWN';
    const phaseConfidence = phaseSnapshot?.confidence || 0.5;
    
    // Risk level
    let riskLevel = 'NORMAL';
    const avgMaxDD = overlay?.stats?.avgMaxDD || 0;
    const volRegime = volatility?.regime;
    
    if (avgMaxDD > 0.15 || volRegime === 'CRISIS' || volRegime === 'EXPANSION') {
      riskLevel = 'CRISIS';
    } else if (avgMaxDD > 0.08 || volRegime === 'HIGH') {
      riskLevel = 'ELEVATED';
    }
    
    return {
      signal,
      consensus: consensus?.score,
      dispersion: consensus?.dispersion,
      confidence,
      reliability,
      entropy,
      phase,
      phaseConfidence,
      riskLevel,
      avgMaxDD,
      volatilityRegime: volRegime,
    };
  }, [consensus, diagnostics, phaseSnapshot, volatility, overlay]);
  
  return (
    <div className="mb-6" data-testid="signal-header">
      {/* Main 4 Cards */}
      <div className="flex flex-wrap gap-3 mb-3">
        <SignalCard 
          signal={derived.signal}
          consensus={derived.consensus}
          dispersion={derived.dispersion}
        />
        <ConfidenceCard 
          confidence={derived.confidence}
          reliability={derived.reliability}
          entropy={derived.entropy}
        />
        <MarketModeCard 
          phase={derived.phase}
          phaseConfidence={derived.phaseConfidence}
        />
        <RiskCard 
          riskLevel={derived.riskLevel}
          avgMaxDD={derived.avgMaxDD}
          volatilityRegime={derived.volatilityRegime}
        />
      </div>
      
      {/* Advanced Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        data-testid="advanced-toggle"
      >
        {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {showAdvanced ? 'Hide' : 'Show'} Advanced Metrics
      </button>
      
      {/* Advanced Section */}
      {showAdvanced && (
        <div className="mt-3 p-4 bg-slate-50 rounded-lg" data-testid="advanced-metrics">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <AdvancedMetric 
              label="Consensus Score" 
              value={derived.consensus ? `${(derived.consensus * 100).toFixed(0)}%` : '—'}
              tooltip="How aligned are the different horizons"
            />
            <AdvancedMetric 
              label="Dispersion" 
              value={derived.dispersion ? `${(derived.dispersion * 100).toFixed(0)}%` : '—'}
              tooltip="Spread in predictions across matches"
            />
            <AdvancedMetric 
              label="Entropy" 
              value={derived.entropy?.toFixed(3) || '—'}
              tooltip="Uncertainty in return distribution (lower = more certain)"
            />
            <AdvancedMetric 
              label="Reliability" 
              value={derived.reliability ? `${(derived.reliability * 100).toFixed(0)}%` : '—'}
              tooltip="Statistical reliability of predictions"
            />
            <AdvancedMetric 
              label="Avg Max DD" 
              value={derived.avgMaxDD ? `-${(derived.avgMaxDD * 100).toFixed(1)}%` : '—'}
              tooltip="Average maximum drawdown from historical matches"
            />
            <AdvancedMetric 
              label="Vol Regime" 
              value={derived.volatilityRegime || '—'}
              tooltip="Current volatility environment"
            />
            <AdvancedMetric 
              label="Conflict Level" 
              value={conflict?.level || '—'}
              tooltip="Degree of conflict between horizons"
            />
            <AdvancedMetric 
              label="Quality Score" 
              value={diagnostics?.qualityScore ? `${(diagnostics.qualityScore * 100).toFixed(0)}%` : '—'}
              tooltip="Overall data quality assessment"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function AdvancedMetric({ label, value, tooltip }) {
  return (
    <div className="flex flex-col" title={tooltip}>
      <span className="text-slate-400 flex items-center gap-1">
        {label}
        <Info className="w-3 h-3 opacity-50" />
      </span>
      <span className="font-mono font-semibold text-slate-700">{value}</span>
    </div>
  );
}

export default SignalHeader;
