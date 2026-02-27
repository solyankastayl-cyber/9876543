/**
 * BLOCK 76.3 — Phase Strength Badge
 * 
 * Institutional-grade phase quality indicator for terminal header.
 * Shows current phase, grade, and strength with warning flags.
 */

import React from 'react';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface PhaseSnapshot {
  symbol: string;
  focus: string;
  tier: 'TIMING' | 'TACTICAL' | 'STRUCTURE';
  phase: string;
  phaseId: string;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  score: number;
  strengthIndex: number;
  hitRate: number;
  sharpe: number;
  expectancy: number;
  samples: number;
  volRegime: string;
  divergenceScore: number;
  flags: string[];
  asof: string;
}

interface PhaseStrengthBadgeProps {
  phaseSnapshot: PhaseSnapshot | null | undefined;
}

// ═══════════════════════════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════════════════════════

const GRADE_COLORS = {
  A: { bg: '#1a7f37', text: '#ffffff' },
  B: { bg: '#2f9e44', text: '#ffffff' },
  C: { bg: '#868e96', text: '#ffffff' },
  D: { bg: '#e67700', text: '#ffffff' },
  F: { bg: '#c92a2a', text: '#ffffff' },
};

const PHASE_COLORS = {
  MARKUP: '#22c55e',
  MARKDOWN: '#ef4444',
  ACCUMULATION: '#3b82f6',
  DISTRIBUTION: '#f97316',
  RECOVERY: '#06b6d4',
  CAPITULATION: '#dc2626',
  UNKNOWN: '#6b7280',
};

// ═══════════════════════════════════════════════════════════════
// FLAG ICONS
// ═══════════════════════════════════════════════════════════════

const FlagIcon = ({ flag }) => {
  const icons = {
    LOW_SAMPLE: '⚠',
    VERY_LOW_SAMPLE: '⚠',
    HIGH_DIVERGENCE: '⚡',
    HIGH_TAIL: '🔥',
    NEGATIVE_SHARPE: '📉',
    VOL_CRISIS: '🚨',
    LOW_RECENCY: '⏳',
  };
  return <span title={flag}>{icons[flag] || '•'}</span>;
};

// ═══════════════════════════════════════════════════════════════
// TOOLTIP CONTENT
// ═══════════════════════════════════════════════════════════════

const TooltipContent = ({ snapshot }) => {
  if (!snapshot) return null;
  
  return (
    <div className="text-xs space-y-2 min-w-[200px]">
      <div className="font-semibold text-slate-200 border-b border-slate-600 pb-1">
        {snapshot.phase} — {snapshot.tier}
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <div className="text-slate-400">Grade</div>
        <div className="text-slate-100 font-medium">{snapshot.grade} ({snapshot.score})</div>
        
        <div className="text-slate-400">Strength</div>
        <div className="text-slate-100 font-medium">{Math.round(snapshot.strengthIndex * 100)}%</div>
        
        <div className="text-slate-400">Hit Rate</div>
        <div className="text-slate-100">{(snapshot.hitRate * 100).toFixed(0)}%</div>
        
        <div className="text-slate-400">Sharpe</div>
        <div className="text-slate-100">{snapshot.sharpe.toFixed(2)}</div>
        
        <div className="text-slate-400">Expectancy</div>
        <div className={snapshot.expectancy >= 0 ? 'text-green-400' : 'text-red-400'}>
          {snapshot.expectancy >= 0 ? '+' : ''}{(snapshot.expectancy * 100).toFixed(1)}%
        </div>
        
        <div className="text-slate-400">Samples</div>
        <div className="text-slate-100">{snapshot.samples}</div>
        
        <div className="text-slate-400">Vol Regime</div>
        <div className={`font-medium ${
          snapshot.volRegime === 'CRISIS' ? 'text-red-400' :
          snapshot.volRegime === 'HIGH' ? 'text-orange-400' :
          snapshot.volRegime === 'EXPANSION' ? 'text-purple-400' :
          'text-slate-100'
        }`}>{snapshot.volRegime}</div>
      </div>
      
      {snapshot.flags?.length > 0 && (
        <div className="pt-1 border-t border-slate-600">
          <div className="text-slate-400 text-[10px] mb-1">FLAGS</div>
          <div className="flex flex-wrap gap-1">
            {snapshot.flags.map((flag, i) => (
              <span key={i} className="px-1.5 py-0.5 bg-slate-700 rounded text-[10px] text-slate-300">
                {flag.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function PhaseStrengthBadge({ phaseSnapshot }) {
  const [showTooltip, setShowTooltip] = React.useState(false);
  
  if (!phaseSnapshot) {
    return null;
  }
  
  const {
    phase,
    grade,
    strengthIndex,
    flags = [],
  } = phaseSnapshot;
  
  const strengthPct = Math.round(strengthIndex * 100);
  const gradeColor = GRADE_COLORS[grade] || GRADE_COLORS.C;
  const phaseColor = PHASE_COLORS[phase] || PHASE_COLORS.UNKNOWN;
  const hasWarnings = flags.length > 0;
  
  return (
    <div 
      className="relative inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      data-testid="phase-strength-badge"
    >
      {/* Phase Label */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-slate-400 font-medium tracking-wide">PHASE</span>
        <span 
          className="text-sm font-semibold"
          style={{ color: phaseColor }}
        >
          {phase}
        </span>
      </div>
      
      {/* Separator */}
      <div className="w-px h-4 bg-slate-300" />
      
      {/* Grade Badge */}
      <div 
        className="px-2 py-0.5 rounded text-xs font-bold"
        style={{ 
          backgroundColor: gradeColor.bg,
          color: gradeColor.text,
        }}
        data-testid="phase-grade"
      >
        {grade}
      </div>
      
      {/* Strength */}
      <span className="text-sm font-semibold text-slate-700" data-testid="phase-strength">
        {strengthPct}%
      </span>
      
      {/* Warning Flags */}
      {hasWarnings && (
        <div className="flex items-center gap-0.5 text-amber-500" data-testid="phase-flags">
          {flags.slice(0, 2).map((flag, i) => (
            <FlagIcon key={i} flag={flag} />
          ))}
        </div>
      )}
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-50 top-full left-0 mt-2 p-3 bg-slate-800 rounded-lg shadow-xl border border-slate-700">
          <TooltipContent snapshot={phaseSnapshot} />
        </div>
      )}
    </div>
  );
}

export default PhaseStrengthBadge;
