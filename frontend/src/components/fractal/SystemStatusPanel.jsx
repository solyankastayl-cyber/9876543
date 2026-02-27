/**
 * SYSTEM STATUS PANEL — Unified State Block
 * 
 * Combines:
 * - Market State (Phase, Consensus, Struct Weight, Divergence)
 * - Projection Context (Focus, Window, Aftermath, Matches, Sample, Coverage, Quality)
 * - Data Status (Real/Fallback, Match count)
 * 
 * All metrics have English tooltips for clarity.
 */

import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, Database } from 'lucide-react';
import { getTierColor, getTierLabel } from '../../hooks/useFocusPack';

// Tooltips - English descriptions
const TOOLTIPS = {
  // Headers
  marketState: 'Current market regime and sentiment indicators.',
  projectionContext: 'Parameters used for pattern matching and forecast generation.',
  dataStatus: 'Quality and availability of historical data for analysis.',
  
  // Market State
  phase: 'Current market cycle phase based on price structure analysis.',
  consensus: 'Agreement level across all time horizons (0-100). Higher values indicate stronger bullish consensus.',
  syncState: 'Alignment status between different analytical layers.',
  structureWeight: 'Influence of long-term structural signals on the overall forecast.',
  divergence: 'Difference between model predictions and actual replay outcomes. Grade A is best.',
  trend: 'Direction of consensus index over the past 7 days.',
  
  // Projection Context
  focus: 'Selected time horizon for analysis. Timing (7-14d), Tactical (30-90d), or Structure (180-365d).',
  window: 'Number of days used for pattern matching lookback.',
  aftermath: 'Number of days projected into the future.',
  matches: 'Number of similar historical patterns found.',
  sample: 'Total sample size used for statistical analysis.',
  coverage: 'Years of historical data available for pattern matching.',
  quality: 'Overall data quality score. Higher is more reliable.',
  
  // Data Status
  realData: 'Analysis based on verified historical data.',
  fallback: 'Limited data available - using fallback estimates.',
  horizonType: 'Classification of time horizons by their analytical purpose.',
};

/**
 * Tooltip component
 */
function Tip({ children, text }) {
  const [show, setShow] = useState(false);
  return (
    <span 
      style={{ position: 'relative', display: 'inline-flex', cursor: 'help' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span style={{
          position: 'absolute',
          bottom: 'calc(100% + 6px)',
          left: '0',
          zIndex: 1000,
          backgroundColor: '#1f2937',
          color: '#fff',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          lineHeight: '1.4',
          width: '200px',
          textAlign: 'left',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontWeight: '400',
          whiteSpace: 'normal',
        }}>
          {text}
          <span style={{
            position: 'absolute',
            bottom: '-5px',
            left: '16px',
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid #1f2937',
          }} />
        </span>
      )}
    </span>
  );
}

/**
 * Mini Sparkline for consensus trend
 */
const MiniSparkline = ({ series, width = 80, height = 24 }) => {
  if (!series || series.length === 0) return null;

  const values = series.map(p => p.consensusIndex);
  const min = Math.min(...values) - 5;
  const max = Math.max(...values) + 5;
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1 || 1)) * (width - 4) + 2;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const first = values[0];
  const last = values[values.length - 1];
  const lineColor = last > first + 2 ? '#16a34a' : last < first - 2 ? '#dc2626' : '#6b7280';

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <path d={pathD} fill="none" stroke={lineColor} strokeWidth="1.5" />
      <circle
        cx={width - 4}
        cy={height - ((last - min) / range) * (height - 6) - 3}
        r="2.5"
        fill={lineColor}
      />
    </svg>
  );
};

/**
 * Single metric row with tooltip
 */
const MetricRow = ({ label, value, valueColor, tooltip }) => (
  <div className="flex items-center justify-between py-1">
    {tooltip ? (
      <Tip text={tooltip}>
        <span className="text-xs text-slate-500">{label}</span>
      </Tip>
    ) : (
      <span className="text-xs text-slate-500">{label}</span>
    )}
    <span className={`text-sm font-medium ${valueColor || 'text-slate-800'}`}>
      {value}
    </span>
  </div>
);

/**
 * Phase badge with full name - text only
 */
const PhaseBadge = ({ phase }) => {
  const phaseMap = {
    'ACCUMULATION': { text: 'text-emerald-600', label: 'Accumulation' },
    'DISTRIBUTION': { text: 'text-amber-600', label: 'Distribution' },
    'MARKUP': { text: 'text-blue-600', label: 'Markup' },
    'MARKDOWN': { text: 'text-red-600', label: 'Markdown' },
    'RECOVERY': { text: 'text-cyan-600', label: 'Recovery' },
    'CAPITULATION': { text: 'text-rose-600', label: 'Capitulation' },
  };
  
  const config = phaseMap[phase] || { text: 'text-slate-600', label: phase };
  
  return (
    <span className={`text-xs font-semibold ${config.text}`}>
      {config.label}
    </span>
  );
};

/**
 * Data status badge - text only
 */
const DataStatusBadge = ({ isReal, matchCount, quality }) => {
  const isRealData = isReal && matchCount > 0 && quality >= 0.5;
  
  return (
    <Tip text={isRealData ? TOOLTIPS.realData : TOOLTIPS.fallback}>
      <span className={`text-xs font-semibold ${isRealData ? 'text-emerald-600' : 'text-amber-600'}`}>
        {isRealData ? 'REAL DATA' : 'FALLBACK'}
      </span>
    </Tip>
  );
};

/**
 * Sync state label
 */
const getSyncLabel = (syncState) => {
  const labels = {
    'BULLISH_ALIGNMENT': 'Bullish',
    'BEARISH_ALIGNMENT': 'Bearish', 
    'STRUCTURAL_DOMINANCE': 'Structural',
    'NEUTRAL': 'Neutral',
    'CHAOTIC': 'Chaotic',
  };
  return labels[syncState] || 'Neutral';
};

/**
 * Main System Status Panel
 */
export function SystemStatusPanel({
  phaseSnapshot,
  consensusPulse,
  meta,
  diagnostics,
  matchesCount,
  dataStatus = 'real',
  className = ''
}) {
  const currentPhase = phaseSnapshot?.phase || 'UNKNOWN';
  
  // Extract consensus data
  const consensusIndex = consensusPulse?.summary?.current || 50;
  const consensusDelta = consensusPulse?.summary?.delta7d || 0;
  const syncState = consensusPulse?.summary?.syncState || 'NEUTRAL';
  const structWeight = consensusPulse?.summary?.avgStructuralWeight || 50;
  
  // Get divergence from last series point
  const lastPulsePoint = consensusPulse?.series?.[consensusPulse.series.length - 1];
  const divergenceGrade = lastPulsePoint?.divergenceGrade || 'C';
  const divergenceScore = lastPulsePoint?.divergenceScore || 50;
  
  // Extract projection context from meta
  const focus = meta?.focus?.toUpperCase() || '30D';
  const tier = meta?.tier || 'TACTICAL';
  const tierColor = getTierColor(tier);
  const window = meta?.windowLen || 60;
  const aftermath = meta?.aftermathDays || 30;
  
  // Extract diagnostics
  const sampleSize = diagnostics?.sampleSize || matchesCount || 0;
  const coverage = diagnostics?.coverageYears || 0;
  const quality = diagnostics?.qualityScore || 0;
  
  // Determine consensus sentiment
  const getConsensusSentiment = (idx) => {
    if (idx >= 70) return { label: 'Bullish', color: 'text-emerald-600' };
    if (idx <= 30) return { label: 'Bearish', color: 'text-red-600' };
    return { label: 'Neutral', color: 'text-slate-600' };
  };
  
  const sentiment = getConsensusSentiment(consensusIndex);

  return (
    <div 
      className={`rounded-xl border border-slate-200 bg-white p-5 ${className}`}
      data-testid="system-status-panel"
    >
      <div className="grid grid-cols-3 gap-8">
        
        {/* LEFT — Market State */}
        <div>
          <Tip text={TOOLTIPS.marketState}>
            <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-400" />
              Market State
            </h4>
          </Tip>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between py-1">
              <Tip text={TOOLTIPS.phase}>
                <span className="text-xs text-slate-500">Phase</span>
              </Tip>
              <PhaseBadge phase={currentPhase} />
            </div>
            
            <div className="flex items-center justify-between py-1">
              <Tip text={TOOLTIPS.consensus}>
                <span className="text-xs text-slate-500">Consensus</span>
              </Tip>
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className="font-bold">{consensusIndex}</span>
                <span className={sentiment.color}>({sentiment.label})</span>
              </span>
            </div>
            
            <MetricRow 
              label="Sync State" 
              tooltip={TOOLTIPS.syncState}
              value={getSyncLabel(syncState)}
              valueColor={
                syncState === 'BULLISH_ALIGNMENT' ? 'text-emerald-600' :
                syncState === 'BEARISH_ALIGNMENT' ? 'text-red-600' :
                'text-slate-600'
              }
            />
            
            <MetricRow 
              label="Structure Weight" 
              tooltip={TOOLTIPS.structureWeight}
              value={`${structWeight}%`}
            />
            
            <div className="flex items-center justify-between py-1">
              <Tip text={TOOLTIPS.divergence}>
                <span className="text-xs text-slate-500">Divergence</span>
              </Tip>
              <span className="flex items-center gap-1 text-sm font-medium">
                <span className={`font-semibold ${
                  divergenceGrade === 'A' ? 'text-emerald-600' :
                  divergenceGrade === 'B' ? 'text-green-600' :
                  divergenceGrade === 'C' ? 'text-amber-600' :
                  divergenceGrade === 'D' ? 'text-orange-600' :
                  'text-red-600'
                }`}>{divergenceGrade}</span>
                <span className="text-slate-400 text-xs">({divergenceScore})</span>
              </span>
            </div>
            
            {/* Mini sparkline for consensus trend */}
            {consensusPulse?.series && (
              <div className="pt-2 mt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <Tip text={TOOLTIPS.trend}>
                    <span className="text-[10px] text-slate-400">7-day trend</span>
                  </Tip>
                  <MiniSparkline series={consensusPulse.series} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CENTER — Projection Context */}
        <div>
          <Tip text={TOOLTIPS.projectionContext}>
            <h4 className="text-sm font-semibold text-slate-800 mb-3">
              Projection Context
            </h4>
          </Tip>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between py-1">
              <Tip text={TOOLTIPS.focus}>
                <span className="text-xs text-slate-500">Focus</span>
              </Tip>
              <span className="flex items-center gap-2">
                <span 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: tierColor }}
                />
                <span className="text-sm font-semibold text-slate-800">{focus}</span>
                <span className="text-xs text-slate-400">({getTierLabel(tier)})</span>
              </span>
            </div>
            
            <MetricRow label="Window" tooltip={TOOLTIPS.window} value={`${window}d`} />
            <MetricRow label="Aftermath" tooltip={TOOLTIPS.aftermath} value={`${aftermath}d`} />
            
            <div className="w-full h-px bg-slate-100 my-1" />
            
            <MetricRow label="Matches" tooltip={TOOLTIPS.matches} value={matchesCount || 0} />
            <MetricRow label="Sample" tooltip={TOOLTIPS.sample} value={sampleSize} />
            <MetricRow 
              label="Coverage" 
              tooltip={TOOLTIPS.coverage}
              value={coverage > 0 ? `${coverage.toFixed(1)}y` : '—'}
            />
            <div className="flex items-center justify-between py-1">
              <Tip text={TOOLTIPS.quality}>
                <span className="text-xs text-slate-500">Quality</span>
              </Tip>
              <span className={`text-sm font-semibold ${
                quality >= 0.8 ? 'text-emerald-600' :
                quality >= 0.6 ? 'text-green-600' :
                quality >= 0.4 ? 'text-amber-600' :
                'text-red-600'
              }`}>
                {(quality * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT — Data Status */}
        <div>
          <Tip text={TOOLTIPS.dataStatus}>
            <h4 className="text-sm font-semibold text-slate-800 mb-3">
              Data Status
            </h4>
          </Tip>
          
          <div className="space-y-3">
            <DataStatusBadge 
              isReal={dataStatus !== 'error' && dataStatus !== 'fallback'} 
              matchCount={matchesCount}
              quality={quality}
            />
            
            <div className="text-sm text-slate-600">
              <span className="font-medium">{matchesCount || 0}</span> historical matches available
            </div>
            
            {quality > 0 && (
              <div className="text-xs text-slate-500">
                {quality >= 0.7 
                  ? 'High confidence analysis'
                  : quality >= 0.5 
                    ? 'Moderate confidence analysis'
                    : 'Limited data - lower confidence'
                }
              </div>
            )}
            
            {/* Tier explanation */}
            <div className="pt-3 mt-3 border-t border-slate-100">
              <Tip text={TOOLTIPS.horizonType}>
                <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-2">
                  Horizon Type
                </div>
              </Tip>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getTierColor('TIMING') }} />
                  <span>Timing</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getTierColor('TACTICAL') }} />
                  <span>Tactical</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getTierColor('STRUCTURE') }} />
                  <span>Structure</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}

export default SystemStatusPanel;
