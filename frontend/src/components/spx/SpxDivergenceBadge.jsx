/**
 * SPX DIVERGENCE BADGE — B6.8.2
 * 
 * Badge (A/B/C/D/F) with tooltip breakdown
 * Features:
 * - Grade badge with color coding
 * - Tooltip with: corr, rmse, terminalΔ, dirMismatch
 * - Inline and standalone variants
 */

import React, { useState } from 'react';

const GRADE_CONFIG = {
  A: { 
    bg: 'bg-emerald-500', 
    text: 'text-white', 
    border: 'border-emerald-600',
    label: 'Excellent',
    desc: 'High correlation, low divergence'
  },
  B: { 
    bg: 'bg-green-500', 
    text: 'text-white', 
    border: 'border-green-600',
    label: 'Good',
    desc: 'Solid alignment with replay'
  },
  C: { 
    bg: 'bg-yellow-500', 
    text: 'text-slate-900', 
    border: 'border-yellow-600',
    label: 'Fair',
    desc: 'Moderate divergence detected'
  },
  D: { 
    bg: 'bg-orange-500', 
    text: 'text-white', 
    border: 'border-orange-600',
    label: 'Poor',
    desc: 'Significant divergence'
  },
  F: { 
    bg: 'bg-red-500', 
    text: 'text-white', 
    border: 'border-red-600',
    label: 'Failing',
    desc: 'Replay no longer valid'
  },
};

/**
 * Tooltip content for divergence breakdown
 */
const DivergenceTooltip = ({ divergence }) => {
  if (!divergence) return null;
  
  const gradeConfig = GRADE_CONFIG[divergence.grade] || GRADE_CONFIG.C;
  
  return (
    <div className="bg-slate-900 text-white rounded-lg shadow-xl p-3 min-w-[220px]">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-700">
        <span className="font-semibold">{gradeConfig.label}</span>
        <span className={`px-2 py-0.5 rounded font-bold ${gradeConfig.bg} ${gradeConfig.text}`}>
          {divergence.grade}
        </span>
      </div>
      
      <div className="text-xs text-slate-400 mb-3">
        {gradeConfig.desc}
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">Correlation</span>
          <span className={`font-mono ${divergence.corr > 0.7 ? 'text-green-400' : divergence.corr > 0.4 ? 'text-yellow-400' : 'text-red-400'}`}>
            {divergence.corr?.toFixed(3)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-slate-400">RMSE</span>
          <span className={`font-mono ${divergence.rmse < 5 ? 'text-green-400' : divergence.rmse < 10 ? 'text-yellow-400' : 'text-red-400'}`}>
            {divergence.rmse?.toFixed(2)}%
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-slate-400">Terminal Δ</span>
          <span className={`font-mono ${Math.abs(divergence.terminalDelta) < 5 ? 'text-green-400' : Math.abs(divergence.terminalDelta) < 15 ? 'text-yellow-400' : 'text-red-400'}`}>
            {divergence.terminalDelta >= 0 ? '+' : ''}{divergence.terminalDelta?.toFixed(1)}%
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-slate-400">Dir Mismatch</span>
          <span className={`font-mono ${divergence.directionalMismatch < 20 ? 'text-green-400' : divergence.directionalMismatch < 40 ? 'text-yellow-400' : 'text-red-400'}`}>
            {divergence.directionalMismatch?.toFixed(0)}%
          </span>
        </div>
      </div>
      
      {divergence.flags?.length > 0 && (
        <div className="mt-3 pt-2 border-t border-slate-700">
          <div className="text-xs text-slate-400 mb-1">Flags</div>
          <div className="flex flex-wrap gap-1">
            {divergence.flags.map((flag, i) => (
              <span key={i} className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">
                {flag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Main Divergence Badge with Tooltip
 */
export const SpxDivergenceBadge = ({ 
  divergence, 
  size = 'md',
  showTooltip = true,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  if (!divergence) return null;
  
  const gradeConfig = GRADE_CONFIG[divergence.grade] || GRADE_CONFIG.C;
  
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };
  
  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid="spx-divergence-badge"
    >
      <div className={`
        ${gradeConfig.bg} ${gradeConfig.text} ${sizeClasses[size]}
        rounded font-bold cursor-help transition-transform
        ${isHovered ? 'scale-110' : ''}
      `}>
        {divergence.grade}
        {size !== 'sm' && (
          <span className="ml-1 font-normal opacity-75">
            ({divergence.score || (divergence.corr * 100).toFixed(0)})
          </span>
        )}
      </div>
      
      {/* Tooltip */}
      {showTooltip && isHovered && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2">
          <DivergenceTooltip divergence={divergence} />
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 
            border-l-8 border-r-8 border-t-8 
            border-l-transparent border-r-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
};

/**
 * Inline divergence indicator (for chart headers)
 */
export const SpxDivergenceInline = ({ divergence, onClick }) => {
  if (!divergence) return null;
  
  const gradeConfig = GRADE_CONFIG[divergence.grade] || GRADE_CONFIG.C;
  
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1.5 px-2 py-1 rounded-lg
        ${gradeConfig.bg} ${gradeConfig.text}
        hover:opacity-90 transition-opacity
      `}
      data-testid="spx-divergence-inline"
    >
      <span className="font-bold">{divergence.grade}</span>
      <span className="text-xs opacity-75">
        Δ{Math.abs(divergence.terminalDelta || 0).toFixed(1)}%
      </span>
    </button>
  );
};

export default SpxDivergenceBadge;
